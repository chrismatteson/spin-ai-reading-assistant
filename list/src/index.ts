import { HandleRequest, HttpRequest, HttpResponse, Config, Kv, Sqlite} from "@fermyon/spin-sdk"

const encoder = new TextEncoder()

export const handleRequest: HandleRequest = async function(request: HttpRequest): Promise<HttpResponse> {
  const conn = Sqlite.openDefault();

  // Get folders and files from database
  let fileTree:Array<JSON> = []

  try {
    const folderTree: Record<string, string[]> = {};
    const folders = conn.execute("SELECT DISTINCT folder FROM files", [])
    for (var f of folders["rows"]) {
      const folder = f[0]!
      const files = conn.execute("SELECT filename FROM files WHERE folder=(?)", [folder])
      console.log(files)
      let filesParsed = []
      for (var t of files["rows"]) {
        filesParsed.push(t[0])
      }
      console.log(filesParsed)
      let folderTree = {
        folder: folder,
        files: filesParsed
      }
      console.log(folderTree)
      fileTree.push(JSON.parse(JSON.stringify(folderTree)))
    }
    return {
      status: 200,
      body: encoder.encode(JSON.stringify(fileTree)).buffer
    }
  } catch (err) { 
    console.log(`${err}`);
    return { status: 500, body: encoder.encode(`${err}`).buffer }
  }
}

