import { HandleRequest, HttpRequest, HttpResponse, Kv } from "@fermyon/spin-sdk";

const encoder = new TextEncoder()

export const handleRequest: HandleRequest = async function (request: HttpRequest): Promise<HttpResponse> {
  // Ensure it's a GET request
  if (request.method !== "GET") {
    return {
      status: 405,
      body: encoder.encode("Method Not Allowed").buffer
    }
  }

  // Initialize the key/value store
  const store = Kv.openDefault();

  // Define the key you want to retrieve from the key/value store
  const key = request.uri
  console.log(key)

  try {
    // Retrieve the value from the key/value store
    const val: any = await store.get(key);

    if (val) {
      // Create an HttpResponse with the PDF data
      return {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
        body: val
        },
      };
    } else {
      return {
        status: 404,
        body: encoder.encode("Key not found").buffer
      }
    }
  } catch (error) {
    console.log("Error reading from key/value store:", `${error}`);
    return {
      status: 500,
      body: encoder.encode("Error reading from key/value store: " + `${error}`).buffer
    }
  };
}
