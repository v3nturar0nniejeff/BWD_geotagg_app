import React from "react";

const ImageModal = ({ isOpen, imageUrl, caption, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClose}>
      <span className="close">&times;</span>
      <img
        className="modal-content"
        id="modalImage"
        src={imageUrl}
        alt={caption}
      />
      <div id="caption">{caption}</div>
    </div>
  );
};

export default ImageModal;
