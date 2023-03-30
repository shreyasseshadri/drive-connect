import React, { useState, useEffect } from 'react';
import axios from 'axios';
import File from './file';
import  NotificationBar  from './notification'

const PAGE_SIZE = 10; // Number of items to fetch at a time
const THRESHOLD = 100; // Distance from bottom of page to fetch more items

const FileList = () => {
  const [files, setFiles] = useState({ items: [], nextPageToken: null });
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hoveredFile, setHoveredFile] = useState(null);

  useEffect(() => {
    console.log("KLoading data!!!");
    const fetchData = async () => {
      setIsLoading(true);

      try {
        const response = await axios.get('http://localhost:7070/fileList', {
          pageSize: PAGE_SIZE,
          pageToken: files.nextPageToken,
        });

        console.log("Queryied server!!!!", response.data.files);
        if (response.data.files.length === 0) {
          setHasMore(false);
        } else {
          setFiles((prevFiles) => ({
            items: [...prevFiles.items, ...response.data.files],
            nextPageToken: response.data.nextPageToken,
          }));
        }
      } catch (error) {
        console.error('Error fetching file list:', error);
      }
      setIsLoading(false);
    };

    const handleScroll = () => {
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight =
        document.documentElement.clientHeight || window.innerHeight;

      if (scrollHeight - scrollTop - clientHeight <= THRESHOLD && hasMore) {
        fetchData();
      }
    };

    fetchData();

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore]);

  const handleFileHover = (file) => {
    setHoveredFile(file);
  };

  const handleFileLeave = () => {
    setHoveredFile(null);
  };

  return (
    <div>
      <NotificationBar/>
      <h2>File List</h2>
      {files.items.map((file, index) => (
        <File
          key={index}
          file={file}
          onMouseEnter={() => handleFileHover(file)}
          onMouseLeave={() => handleFileLeave()}
          isHovered={hoveredFile === file}
        />
      ))}
      {isLoading && <div>Loading...</div>}
      {!isLoading && !hasMore && <div>No more files to load.</div>}
    </div>
  );
};

export default FileList;
