exports.handler = async (event) => {
  try {
    const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*"
};
    
  return { statusCode: 200, headers, body: JSON.stringify({ items: [] }) };

  } catch (e) {
    const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*"
};
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};