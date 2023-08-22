import { HandleRequest, HttpRequest, HttpResponse, Config, Kv, Sqlite} from "@fermyon/spin-sdk"

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const handleRequest: HandleRequest = async function(request: HttpRequest): Promise<HttpResponse> {
  console.log("0")
  //Decode headers
  let folder = request.headers.folder
  let filename = request.headers.filename
  let fullText = decoder.decode(request.body)!
  let halfText = fullText!
  let smallText = fullText!
  let bullets = fullText!

  //Save request to database
  const conn = Sqlite.openDefault();
  try {
    const query = `
    INSERT INTO files
      (folder, filename, fullText, halfText, smallText, bullets)
    VALUES
      (?, ?, ?, ?, ?, ?)
    `;
    conn.execute(query, [folder, filename, fullText, halfText, smallText, bullets])
    const insertedData = conn.execute("SELECT * FROM files WHERE filename = (?) and folder = (?)", [filename, folder])
    console.log(insertedData)

    return {
      status: 200,
      body: encoder.encode("Successfully inserted " + filename + " into database").buffer
    }
  } catch (err) {
    console.log(`${err}`);
    return { status: 500, body: encoder.encode(`${err}`).buffer }
  }
}
