import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ResizableBox } from 'react-resizable';
import './App.css'; // Import your CSS file with the specified styles

// Interfaces
interface TextDisplayProps {
  selectedFile: string | null;
  selectedFolder: string | null;
  setSelectedFile: (file: string | null) => void;
  setSelectedFolder: (file: string | null) => void;
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
const FolderTree: React.FC<TextDisplayProps> = ({ setSelectedFolder, setSelectedFile }) => {
  const [folderTree, setFolderTree] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolderState] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  useEffect(() => {
    // Fetch folder tree data from /api/list or your API endpoint
    fetch('/api/list')
      .then((response) => response.json())
      .then((data: { folder: string; files: string[] }[]) => {
        setFolderTree(data); // No need to restructure the data; it's in the right format
      })
      .catch((error) => console.error('Error fetching folder tree:', error));
  }, []);

  const handleFileClick = (folder: string, file: string) => {
    setSelectedFolderState(folder);
    setSelectedFileName(file);

    // When a file is clicked, update the selected file in the TextDisplay
    setSelectedFile(file);
  };

  return (
    <div className="folder-tree">
      <h2>Folder Tree</h2>
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
                    selectedFileName === file
                      ? 'selected'
                      : ''
                  }
                  onClick={() => handleFileClick(folderData.folder, file)}
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

  return (
    <div className="text-display">
      <h2>Text Display</h2>
      <div className="length-options">
        <label>
          <input
            type="radio"
            value="Full Text"
            checked={selectedLength === 'Full Text'}
            onChange={handleLengthChange}
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
        <pre>{text}</pre>
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
    setAppState((prevState) => ({
      ...prevState,
      selectedFolder: folder,
      selectedFile: file,
    }));
  };

  const handleLengthChange = (selectedLength: 'Full Text' | 'Half Text' | 'Small Text' | 'Bullets') => {
    // Update the selected length in the app state
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
            selectedFolder={appState.selectedFolder}
            setSelectedFolder={(folder: string | null) => handleFileSelect(folder, null)}
            selectedFile={appState.selectedFile}
            setSelectedFile={(file) => handleFileSelect(appState.selectedFolder, file)}
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
              selectedFolder={appState.selectedFolder}
              setSelectedFolder={(folder: string | null) => handleFileSelect(folder, null)}
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