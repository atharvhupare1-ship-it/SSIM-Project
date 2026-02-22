/**
 * Parse JSON request body from incoming HTTP request.
 * Enforces a 1MB size limit to prevent abuse.
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<object>} Parsed JSON body
 */
export const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = "";
    const MAX_SIZE = 1024 * 1024; // 1MB

    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > MAX_SIZE) {
        reject(new Error("Request body too large"));
      }
    });

    req.on("end", () => {
      try {
        if (!body || body.trim() === "") {
          resolve({});
        } else {
          resolve(JSON.parse(body));
        }
      } catch (err) {
        reject(new Error("Invalid JSON in request body"));
      }
    });

    req.on("error", (err) => reject(err));
  });
};
