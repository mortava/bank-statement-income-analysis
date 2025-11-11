
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { RemoveIcon } from './icons/RemoveIcon';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange, disabled = false }) => {
  const [dragging, setDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      onFilesChange(files);
    }
  };

  const handleDragEvent = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvent(e);
    if (!disabled) setDragging(true);
  }, [handleDragEvent, disabled]);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvent(e);
    setDragging(false);
  }, [handleDragEvent]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvent(e);
    setDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((file: File) => file.type === 'application/pdf');
      setSelectedFiles(files);
      onFilesChange(files);
    }
  }, [handleDragEvent, onFilesChange, disabled]);

  const handleRemoveFile = (indexToRemove: number) => {
    const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(newFiles);
    onFilesChange(newFiles);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const triggerFileSelect = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col space-y-4">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragEvent}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`relative p-6 border-2 border-dashed rounded-lg transition-colors duration-200 text-center ${
          disabled ? 'bg-gray-100 cursor-not-allowed' :
          dragging ? 'border-primary-500 bg-primary-50 cursor-pointer' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50 cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        {disabled ? (
          <div className="flex flex-col items-center justify-center space-y-2 text-gray-500">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-semibold mt-2">Processing...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 text-gray-500">
            <UploadIcon className="w-10 h-10" />
            <p className="font-semibold">
              <span className="text-primary-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs">PDF files only</p>
          </div>
        )}
      </div>
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700">Selected files:</h4>
            <ul className="space-y-1">
                {selectedFiles.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex items-center justify-between p-2 pr-1 bg-gray-100 rounded-md text-gray-800 text-sm">
                        <span className="truncate mr-2">{file.name}</span>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // prevent file dialog from opening
                              handleRemoveFile(index);
                            }}
                            className="p-1 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                            aria-label={`Remove ${file.name}`}
                          >
                            <RemoveIcon className="w-4 h-4" />
                          </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
};
