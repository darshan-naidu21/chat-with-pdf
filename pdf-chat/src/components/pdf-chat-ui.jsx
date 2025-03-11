import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowUp, Upload, FileText } from "lucide-react";
import background from "../assets/background.png";
import niseLogo from "../assets/nise.png";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import axios from "axios";
import { Progress } from "@/components/ui/progress";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
	'../../../pdf-chat/node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
	import.meta.url,
).toString();

export default function PDFChatUI() {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(URL.createObjectURL(file));
      console.log("📂 File selected:", file.name);

      setIsUploading(true);
      setProgress(10); // Start at 10% to indicate something is happening

      const formData = new FormData();
      formData.append("file", file);

      console.log("⏳ Upload started...");

      let simulatedProgress = 10;
      const progressInterval = setInterval(() => {
        simulatedProgress += Math.random() * 10; // Increase randomly by 5-10%
        if (simulatedProgress >= 90) {
          clearInterval(progressInterval); // Stop at ~90% until response
        } else {
          setProgress(simulatedProgress);
        }
      }, 500); // Update every 500ms for smooth UI feel

      const startTime = Date.now();

      try {
        await axios.post("http://127.0.0.1:8000/upload_pdf", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        clearInterval(progressInterval);
        setProgress(100); // Set to 100% once upload is confirmed

        const endTime = Date.now();
        console.log("✅ File uploaded successfully!");
        console.log(`⏳ Total Time Taken: ${(endTime - startTime) / 1000} seconds`);
      } catch (error) {
        clearInterval(progressInterval);
        console.error("❌ Error uploading file:", error);
      }

      setTimeout(() => {
        setIsUploading(false);
        setProgress(0); // Reset progress after a short delay
      }, 1000);
    }
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim() || !pdfFile) return;
    
    setIsLoading(true);
    setMessages([...messages, { role: "user", content: input }]);
    
    try {
      const response = await axios.post("http://127.0.0.1:8000/get_response", { user_message: input });
      setMessages((prevMessages) => [...prevMessages, { role: "bot", content: response.data.bot_reply }]);
      console.log(response)
    } catch (error) {
      console.error("Error fetching response:", error);
    }
    
    setInput("");
    setIsLoading(false);
  };


  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, numPages));
  };

  return (
    <div className="flex flex-col h-screen text-foreground bg-cover" style={{ backgroundImage: `url(${background})` }}>
      <header className="sticky top-0 z-10 text-purple text-3xl font-bold font-poppins py-4 px-6 flex justify-center items-center">
        <div className="flex items-center justify-center">
          <FileText className="w-10 h-10 mr-2" />
          PDF Chat Assistant
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto w-full p-4 space-y-4 mb-[120px]">
          <div className="flex justify-center mb-4">
            <Button onClick={triggerFileInput} className="bg-purple text-white">
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload PDF"}
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
          </div>

          {isUploading && <Progress value={progress} className="w-[100%]" />}

          {pdfFile && (
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <h2 className="text-lg font-semibold mb-2">Current PDF</h2>
              <nav className="flex justify-between items-center mb-2">
                <Button onClick={goToPrevPage} disabled={currentPage <= 1} className="text-sm">
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {numPages}
                </span>
                <Button onClick={goToNextPage} disabled={currentPage >= numPages} className="text-sm">
                  Next
                </Button>
              </nav>
              <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess} className="border border-gray-200 rounded">
                <Page pageNumber={currentPage} width={600} />
              </Document>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`p-4 rounded-lg ${message.role === "user" ? "bg-light-purple-2 ml-auto font-poppins max-w-[90%] md:max-w-[70%] " : "bg-blue-100"} max-w-[80%] font-poppins`}>
              <p>{message.content}</p>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-center">
              <div className="loader"></div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      <div className="sticky bottom-14 left-0 right-0 px-4">
        <div className="max-w-2xl mx-auto cursor-text bg-light-purple-2 p-4 rounded-xl">
          <form onSubmit={handleSubmit} className={`flex flex-col ${isLoading ? "opacity-50" : ""}`}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={pdfFile ? "Ask anything about the PDF" : "Upload a PDF to start chatting"}
              className="w-full bg-transparent text-oil-black font-poppins border-none outline-none resize-none overflow-y-auto mb-2 p-0 text-base md:text-lg placeholder:text-base placeholder:md:text-lg min-h-[60px] sm:min-h-[80px] md:min-h-[80px] lg:min-h-[80px]"
              rows={1}
              disabled={isLoading || !pdfFile}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-full flex bg-oil-black justify-center items-center hover:opacity-50 transition-opacity duration-200"
                disabled={isLoading || !pdfFile}
                style={{
                  cursor: isLoading || !pdfFile ? "not-allowed" : "pointer",
                  width: "10vw",
                  height: "10vw",
                  maxWidth: "42px",
                  maxHeight: "42px",
                }}
              >
                <ArrowUp size="50%" color="#ffffff" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <footer className="text-purple font-poppins w-full py-3 fixed bottom-0 left-0 right-0 flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <p className="text-sm md:text-base font-semibold">&copy; 2025 NiSE Insight. All rights reserved.</p>
          <img src={niseLogo || "/placeholder.svg"} alt="NiSE Insight Logo" className="h-8 w-auto" />
        </div>
      </footer>
    </div>
  );
}
