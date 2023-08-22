import { HandleRequest, HttpRequest, HttpResponse, Kv, Config, Sqlite} from "@fermyon/spin-sdk"

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const handleRequest: HandleRequest = async function(request: HttpRequest): Promise<HttpResponse> {
  const translationMap: Record<'Full Text' | 'Half Text' | 'Small Text' | 'Bullets', string> = {
    'Full Text': 'fullText',
    'Half Text': 'halfText',
    'Small Text': 'smallText',
    'Bullets': 'bullets',
  };

  //Decode body
  let decodedBody = new URLSearchParams(decoder.decode(request.body));
  let folder = decodedBody.get("folder")!
  let filename = decodedBody.get("filename")!
  let rawLength = decodedBody.get("length")!
  let length = translationMap[rawLength as 'Full Text' | 'Half Text' | 'Small Text' | 'Bullets'];

  //Fetch file from database
  const conn = Sqlite.openDefault();
  const text = conn.execute(`SELECT ${length} FROM files WHERE folder=(?) AND filename=(?)`, [folder, filename])
  console.log(text)
  return {
      status: 200,
      body: encoder.encode(JSON.stringify(text["rows"][0])).buffer
    }
}
