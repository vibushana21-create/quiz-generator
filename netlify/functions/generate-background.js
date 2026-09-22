exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        error: "Method not allowed"
      })
    };
  }

  if (!process.env.CREW_API_URL) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "CREW_API_URL is not configured."
      })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const payload = {
      recipient_email: body.recipient_email,
      recipient_name: body.recipient_name,
      study_material_path: body.pdf_link,
      quiz_title: body.quiz_title
    };

    const missing = Object.keys(payload).filter(
      key => !payload[key]
    );

    if (missing.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Missing required fields: ${missing.join(", ")}`
        })
      };
    }

    const endpoint = process.env.CREW_API_URL.endsWith("/kickoff")
      ? process.env.CREW_API_URL
      : `${process.env.CREW_API_URL}/kickoff`;

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.CREW_API_KEY
          ? {
              Authorization: `Bearer ${process.env.CREW_API_KEY}`
            }
          : {})
      },
      body: JSON.stringify(payload)
    })
      .then(async response => {
        console.log(
          "CrewAI response:",
          response.status,
          await response.text()
        );
      })
      .catch(error => {
        console.error("CrewAI error:", error);
      });

    return {
      statusCode: 202,
      body: JSON.stringify({
        success: true,
        message:
          "Quiz generation started. CrewAI is processing the workflow."
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
