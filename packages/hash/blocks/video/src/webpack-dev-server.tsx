/**
 * webpack-dev-server entry point for debugging.
 * This file is not bundled with the library during the build process.
 */
import React from "react";
import ReactDOM from "react-dom";
import Component from "./index";

const node = document.getElementById("app");

const App = () => {
  const uploadFile = async ({
    file,
    url,
  }: {
    file?: File;
    url?: string;
  }): Promise<{
    src?: string;
    error?: string;
  }> => {
    if (url?.trim()) {
      return { src: url };
    }

    if (file) {
      return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = function (event) {
          if (event.target?.result) {
            resolve({ src: event.target.result.toString() });
          } else {
            resolve({ error: "Couldn't read your file" });
          }
        };

        reader.readAsDataURL(file);
      });
    }

    return {
      error: "Please enter a valid video URL or select a file below",
    };
  };

  return (
    <div style={{ marginTop: 20 }}>
      <Component
        initialSrc={
          "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm"
        }
        initialCaption={"ASDASDASDSAD"}
        entityId={"entity-asdasd"}
        uploadFile={uploadFile}
      />
    </div>
  );
};

ReactDOM.render(<App />, node);
