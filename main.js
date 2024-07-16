document.addEventListener("DOMContentLoaded", function () {
    const dropZone = document.getElementById("drop-zone");
    const output = document.getElementById("output");

    dropZone.addEventListener("dragover", function (e) {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", function (e) {
        dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", function (e) {
        e.preventDefault();
        dropZone.classList.remove("dragover");

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const imageData = event.target.result;

                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, canvas.width, canvas.height);

                    if (code) {
                        console.log("QR Code data:", code.data);

                        try {
                            const base64Data = code.data;
                            const binaryString = atob(base64Data);
                            console.log("Base64 decoded string:", binaryString);

                            // Convert binary string to byte array
                            const binaryLength = binaryString.length;
                            const bytes = new Uint8Array(binaryLength);
                            for (let i = 0; i < binaryLength; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }

                            console.log("Byte array:", bytes);

                            // Try decompressing the byte array
                            let decompressedData;
                            try {
                                decompressedData = pako.inflate(bytes, { raw: true, to: 'string' });
                                console.log("Decompressed data (raw):", decompressedData);
                            } catch (rawError) {
                                console.warn("Raw decompression failed:", rawError);
                                try {
                                    decompressedData = pako.inflate(bytes, { to: 'string' });
                                    console.log("Decompressed data (standard):", decompressedData);
                                } catch (standardError) {
                                    console.error("Standard decompression failed:", standardError);
                                    output.textContent = "Decompression failed: " + standardError.message;
                                    return;
                                }
                            }

                            // Parse the decompressed data as JSON
                            try {
                                const jsonData = JSON.parse(decompressedData);
                                console.log("JSON data:", jsonData);

                                // Display the JSON data
                                output.innerHTML = `<div>Received JSON:</div><pre style="word-wrap: break-word; white-space: pre-wrap;">${JSON.stringify(jsonData, null, 2)}</pre>`;

                                // Display the server URL as a hyperlink if it exists
                                if (jsonData.general && jsonData.general.server_url) {
                                    const serverUrl = jsonData.general.server_url;
                                    const encodedServerUrl = encodeURIComponent(serverUrl);
                                    const uploadUrl = `https://sagetechnologiesllc.github.io/web-vb/?server=${encodedServerUrl}`;

                                    const link = document.createElement("a");
                                    link.href = serverUrl;
                                    link.textContent = serverUrl;
                                    link.target = "_blank";
                                    link.className = "url-link";

                                    const uploadLink = document.createElement("a");
                                    uploadLink.href = uploadUrl;
                                    uploadLink.textContent = uploadUrl;
                                    uploadLink.target = "_blank";
                                    uploadLink.className = "url-link";

                                    const copyButton = document.createElement("button");
                                    copyButton.textContent = "Copy to Clipboard";
                                    copyButton.onclick = () => {
                                        navigator.clipboard.writeText(uploadUrl).then(() => {
                                            alert("Upload URL copied to clipboard!");
                                        });
                                    };
                                    copyButton.className = "copy-button";

                                    output.innerHTML += `<br><br><div>Parsed Server URL:</div>`;
                                    output.appendChild(link);
                                    output.innerHTML += `<br><br><div>Upload URL to Share With Team:</div>`;
                                    const uploadContainer = document.createElement("div");
                                    uploadContainer.style.display = "flex";
                                    uploadContainer.style.alignItems = "center";
                                    uploadContainer.appendChild(copyButton);
                                    uploadContainer.appendChild(uploadLink);
                                    output.appendChild(uploadContainer);
                                }
                            } catch (jsonError) {
                                console.error("JSON parsing failed:", jsonError);
                                output.textContent = "JSON parsing failed: " + jsonError.message;
                            }
                        } catch (error) {
                            console.error("Error:", error);
                            output.textContent = "An error occurred while processing the data.";
                        }
                    } else {
                        output.textContent = "No QR code found.";
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            output.textContent = "Please drop a valid image file.";
        }
    });
});
