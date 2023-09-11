import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ResizableBox } from 'react-resizable';
import './App.css'; // Import your CSS file with the specified styles

// Interfaces
interface TextDisplayProps {
  folderTree: Folder[];
  selectedFile: string | null;
  selectedFolder: string | null;
  setSelectedFile: (folder: string | null, file: string | null) => void;
}

interface Folder {
  folder: string;
  files: string[];
}
  
interface ChatMessage {
  user: string;
  message: string;
}
  
interface AppState {
  selectedFile: string | null;
  selectedFolder: string | null;
  selectedLength: 'Full Text' | 'Half Text' | 'Small Text' | 'Bullets';
  folderTree: Folder[];
  chatMessages: ChatMessage[];
}
  
// Component: Folder Tree
const FolderTree: React.FC<TextDisplayProps> = ({ folderTree, selectedFile, selectedFolder, setSelectedFile }) => {
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<File | null>(null);
  const [selectedFolderForUpload, setSelectedFolderForUpload] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Function to handle file selection
  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFileForUpload(file);
    } else {
      // Handle invalid file type (not PDF)
      setUploadMessage('Invalid file type. Please select a PDF file.');
      console.error('Invalid file type. Please select a PDF file.');
    }
  };

  // Function to handle folder selection for upload
  const handleFolderSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFolderForUpload(event.target.value);
  };

  const handleFileUpload = async () => {
    if (selectedFileForUpload && selectedFolderForUpload) {
      const formData = new FormData();
      formData.append('file', selectedFileForUpload);
      
      // Set headers for filename and folder
      const headers = new Headers();
      headers.append('filename', selectedFileForUpload.name);
      headers.append('folder', selectedFolderForUpload);

      try {
        // Make the POST request to api/write
        const response = await fetch('/api/write', {
          method: 'POST',
          body: formData,
          headers,
        });

        if (response.ok) {
          // Handle successful file upload
          setUploadMessage('File uploaded successfully.');
          console.log('File uploaded successfully.');
          setSelectedFileForUpload(null); // Clear selected file
        } else {
          // Handle upload failure
          setUploadMessage('File upload failed.');
          console.error('File upload failed.');
        }
      } catch (error) {
        setUploadMessage('An error occurred during upload.');
        console.error('Error uploading file:', error);
      }
    } else {
      // Handle missing file or folder
      setUploadMessage('Please select a file and folder before uploading.');
      console.error('Please select a file and folder before uploading.');
    }
  };

  return (
    <div className="folder-tree">
      <h2>Folder Tree</h2>
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileSelection}
      />
      <select onChange={handleFolderSelection}>
        <option value="">Select a folder</option>
        {folderTree.map((folderData, index) => (
          <option key={index} value={folderData.folder}>
            {folderData.folder}
          </option>
        ))}
      </select>
      <button onClick={handleFileUpload}>Upload PDF</button>
      {uploadMessage && <div className={uploadMessage.includes('success') ? 'success-message' : 'error-message'}>{uploadMessage}</div>}
      <ul>
        {folderTree.map((folderData, index) => (
          <li key={index}>
            <strong>{folderData.folder}</strong>
            <ul>
              {folderData.files.map((file, fileIndex) => (
                <li
                  key={fileIndex}
                  className={
                    selectedFolder === folderData.folder &&
                    selectedFile === file
                      ? 'selected'
                      : ''
                  }
                  onClick={() => setSelectedFile(folderData.folder, file)}
                >
                  {file}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};
  
// Component: Text Display
const TextDisplay: React.FC<TextDisplayProps> = ({ selectedFolder, selectedFile }) => {
  const [text, setText] = useState<string>(''); // State to store the displayed text
  const [selectedLength, setSelectedLength] = useState<'Full Text' | 'Half Text' | 'Small Text' | 'Bullets'>('Full Text');
  const [pdfFilePath, setPdfFilePath] = useState<string | null>(null); // State to store PDF file path

  useEffect(() => {
    // Fetch the selected file's text based on selectedFile and selectedLength
    if (selectedFile && selectedFolder) {
      // Prepare the request body as x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append('folder', selectedFolder!);
      formData.append('filename', selectedFile);
      formData.append('length', selectedLength);

      // Make the fetch request with the custom Content-Type header
      fetch(`/api/read`, {
        method: 'POST',
        body: formData.toString(),
        headers: new Headers({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      })
        .then((response) => response.text())
        .then((data) => setText(data))
        .catch((error) => console.error('Error fetching text:', error));
    }
  }, [selectedFolder, selectedFile, selectedLength]);

  const handleLengthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedLength(event.target.value as 'Full Text' | 'Half Text' | 'Small Text' | 'Bullets');
  };

  const handleFullSizeOpen = () => {
    // Set the PDF file path when "Full Text" is selected
    setPdfFilePath(`${text}`);
    console.log("Full Text")
  };

  return (
    <div className="text-display">
      <h2>Text Display</h2>
      <div className="length-options">
        <label>
          <input
            type="radio"
            value="Full Text"
            checked={selectedLength === 'Full Text'}
            onChange={(event) => {
              handleLengthChange(event);
              handleFullSizeOpen();
            }}
          />
          Full Text
        </label>
        <label>
          <input
            type="radio"
            value="Half Text"
            checked={selectedLength === 'Half Text'}
            onChange={handleLengthChange}
          />
          Half Text
        </label>
        <label>
          <input
            type="radio"
            value="Small Text"
            checked={selectedLength === 'Small Text'}
            onChange={handleLengthChange}
          />
          Small Text
        </label>
        <label>
          <input
            type="radio"
            value="Bullets"
            checked={selectedLength === 'Bullets'}
            onChange={handleLengthChange}
          />
          Bullets
        </label>
      </div>
      <div className="text-content">
        {pdfFilePath ? (
          <object data={pdfFilePath} type="application/pdf" width="100%" height="500px">
            <p>Unable to display PDF file. <a href={pdfFilePath}>Download</a> instead.</p>
          </object>
        ) : (
          <pre>{text}</pre>
        )}
      </div>
    </div>
  );
};
  
  const ChatInterface: React.FC = () => {
    const [userInput, setUserInput] = useState<string>('');
    const [response, setResponse] = useState<string>('');
  
    const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      setUserInput(e.target.value);
    };
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
  
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: userInput,
        });
  
        if (response.ok) {
          const text = await response.text();
          setResponse(text);
        } else {
          // Handle error
          console.error('Error fetching chat response');
        }
      } catch (error) {
        console.error('Error fetching chat response:', error);
      }
    };
  
    return (
      <div className="chat-interface">
        <h2>Chat Interface</h2>
        <div className="chat-container">
          <div className="chat-response">
            <strong>User:</strong> {userInput}
          </div>
          <div className="chat-response">
            <strong>Response:</strong> {response}
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Type your prompt..."
            value={userInput}
            onChange={handleUserInput}
          />
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  };
  
// App Component
const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    selectedFile: null,
    selectedFolder: null,
    selectedLength: 'Full Text',
    folderTree: [],
    chatMessages: [],
  });

  const handleFileSelect = (folder: string | null, file: string | null) => {
    // Update the selected folder and file in the app state
    console.log("handleFileSelect " + folder)
    console.log("handleFileSelect " + file)
    setAppState((prevState) => ({
      ...prevState,
      selectedFolder: folder,
      selectedFile: file,
    }));
  };

  const handleLengthChange = (selectedLength: 'Full Text' | 'Half Text' | 'Small Text' | 'Bullets') => {
    // Update the selected length in the app state
    console.log("handleLengthChange " + selectedLength)
    setAppState((prevState) => ({
      ...prevState,
      selectedLength,
    }));
  };

  // Fetch folder tree data from /api/list and handle user interactions
  useEffect(() => {
    // Fetch folder tree data from /api/list or your API endpoint
    fetch('/api/list')
      .then((response) => response.json())
      .then((data) => {
        // Set the initial selected folder and file based on your logic
        // For now, let's assume we select the first folder and first file
        const initialSelectedFolder = data[0]?.folder || null;
        const initialSelectedFile = data[0]?.files[0] || null;
        
        setAppState({
          selectedFile: initialSelectedFile,
          selectedFolder: initialSelectedFolder,
          selectedLength: 'Full Text',
          folderTree: data,
          chatMessages: [],
        });
      })
      .catch((error) => console.error('Error fetching folder tree:', error));
  }, []);

  return (
    <div className="App">
      <ResizableBox
        width={300}
        height={window.innerHeight}
        axis="x"
        minConstraints={[300, 0]}
        maxConstraints={[window.innerWidth * 0.66, 0]}
      >
        <div className="left-box">
          <FolderTree
            folderTree={appState.folderTree}
            selectedFolder={appState.selectedFolder}
            selectedFile={appState.selectedFile}
            setSelectedFile={handleFileSelect}
          />
        </div>
      </ResizableBox>
      <div className="right-container">
        <ResizableBox
          width={window.innerWidth * 0.66}
          height={window.innerHeight * 0.66}
          axis="x"
          minConstraints={[100, 0]}
        >
          <div className="top-right-box">
            <TextDisplay
              folderTree={appState.folderTree}
              selectedFolder={appState.selectedFolder}
              selectedFile={appState.selectedFile}
              setSelectedFile={(file) => handleFileSelect(appState.selectedFolder, file)}
            />
          </div>
        </ResizableBox>
        <ResizableBox
          width={window.innerWidth * 0.66}
          height={window.innerHeight * 0.33}
          axis="x"
          minConstraints={[100, 0]}
        >
          <div className="bottom-right-box">
            <ChatInterface />
          </div>
        </ResizableBox>
      </div>
    </div>
  );
};
  
  export default App;

  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );