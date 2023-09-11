import { HandleRequest, HttpRequest, HttpResponse, Config, Kv, Sqlite, Llm, InferencingModels} from "@fermyon/spin-sdk"
import { PDFDocument } from 'pdf-lib'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const handleRequest: HandleRequest = async function(request: HttpRequest): Promise<HttpResponse> {
  const store = Kv.openDefault();

  //Decode headers
  let folder = request.headers.folder
  let filename = request.headers.filename
  let fullText = request.body!
  console.log(fullText)
  //const parsedText = fullText
  const parsedText = await PDFDocument.load(fullText, {
    updateMetadata: false
  })
  console.log(parsedText.context)
  
  try {
  if (!folder && !filename && !fullText) {
    throw new Error('Headers "filename" and "folder" and text are empty.');
  } else if (!filename) {
    throw new Error('Header "filename" is empty.');
  } else if (!folder) {
    throw new Error('Header "folder" is empty.');
  } else if (!fullText) {
    throw new Error('Text is empty.');
  }
  } catch(err) { 
    return { status: 500, body: "encoder.encode(`${err}`).buffer" }
  }

  let halfText = ""
  let smallText = ""
  let bullets = ""

  const prompt = "Summerize the following markdown into 3 versions, one approximatley 50% of the length retaining all of the images, one 'cliffnotes' version with most useful images, and one bullet points versions. Return them in the format of {'halfText': <text>, 'smallText': <text>, 'bullets': <text>}: " + fullText
  try {
    const completion = await Llm.infer(InferencingModels.Llama2Chat, prompt)
    let response = completion.text
    let responseJSON = JSON.parse(JSON.stringify(response))
    console.log(responseJSON)
    halfText = responseJSON["halfText"]
    smallText = responseJSON["smallText"]
    bullets = responseJSON["bullets"]
  } catch(err) {
    console.log(`${err}`)
    return { status: 500, body: encoder.encode(`${err}`).buffer }
  }

  //Save request to KV and database
  const conn = Sqlite.openDefault();
  try {
    store.set(`/upload/${filename}`, fullText)
    const query = `
    INSERT INTO files
      (folder, filename, fullText, halfText, smallText, bullets)
    VALUES
      (?, ?, ?, ?, ?, ?)
    `;
    conn.execute(query, [folder, filename, `/upload/${filename}`, halfText, smallText, bullets])
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
