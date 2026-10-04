document.addEventListener("DOMContentLoaded", () => {

    // =========================================
    // ELEMENTS
    // =========================================

    const imageInput = document.getElementById("imageInput");
    const generateButton = document.getElementById("generateButton");

    const fileName = document.getElementById("fileName");
    const status = document.getElementById("status");

    const originalImage = document.getElementById("originalImage");
    const imagePlaceholder = document.getElementById("imagePlaceholder");

    const preview = document.getElementById("preview");
    const previewStatus = document.getElementById("previewStatus");

    const htmlCode = document.getElementById("htmlCode");
    const cssCode = document.getElementById("cssCode");

    const htmlTab = document.getElementById("htmlTab");
    const cssTab = document.getElementById("cssTab");

    const downloadButton = document.getElementById("downloadButton");

    const refineButton = document.getElementById("refineButton");
    const refineInput = document.getElementById("refineInput");


    // =========================================
    // GENERATED CODE
    // =========================================

    let generatedHTML = "";
    let generatedCSS = "";


    // =========================================
    // INITIAL STATE
    // =========================================

    generateButton.disabled = true;

    if (downloadButton) {
        downloadButton.disabled = true;
    }

    if (refineButton) {
        refineButton.disabled = true;
    }


    // =========================================
    // FILE SELECTION
    // =========================================

    imageInput.addEventListener("change", () => {

        if (imageInput.files.length === 0) {

            fileName.textContent = "No file selected";

            generateButton.disabled = true;

            return;
        }


        const file = imageInput.files[0];

        fileName.textContent = file.name;

        generateButton.disabled = false;


        // Show original screenshot

        const imageURL = URL.createObjectURL(file);

        originalImage.src = imageURL;

        originalImage.style.display = "block";

        imagePlaceholder.style.display = "none";


        // Clear previous result

        generatedHTML = "";
        generatedCSS = "";

        htmlCode.textContent = "No code generated yet.";
        cssCode.textContent = "No code generated yet.";

        preview.srcdoc = "";

        previewStatus.textContent = "Waiting";

        if (downloadButton) {
            downloadButton.disabled = true;
        }

        if (refineButton) {
            refineButton.disabled = true;
        }

        status.textContent =
            "Screenshot selected. Ready to generate.";
    });


    // =========================================
    // HTML TAB
    // =========================================

    htmlTab.addEventListener("click", () => {

        htmlTab.classList.add("active");
        cssTab.classList.remove("active");

        htmlCode.classList.add("active");
        cssCode.classList.remove("active");
    });


    // =========================================
    // CSS TAB
    // =========================================

    cssTab.addEventListener("click", () => {

        cssTab.classList.add("active");
        htmlTab.classList.remove("active");

        cssCode.classList.add("active");
        htmlCode.classList.remove("active");
    });


    // =========================================
    // GENERATE BUTTON
    // =========================================

    generateButton.addEventListener("click", generateCode);


    // =========================================
    // GENERATE CODE
    // =========================================

    async function generateCode() {

        if (imageInput.files.length === 0) {

            status.textContent =
                "Please select a screenshot.";

            return;
        }


        generateButton.disabled = true;

        if (downloadButton) {
            downloadButton.disabled = true;
        }

        if (refineButton) {
            refineButton.disabled = true;
        }


        status.textContent =
            "Gemini is analyzing your screenshot...";

        previewStatus.textContent =
            "Generating";


        const formData = new FormData();

        formData.append(
            "image",
            imageInput.files[0]
        );


        try {

            console.log("Sending screenshot to Flask...");


            const response = await fetch(
                "http://127.0.0.1:5000/upload",
                {
                    method: "POST",
                    body: formData
                }
            );


            console.log(
                "Upload response status:",
                response.status
            );


            const data = await response.json();


            console.log(
                "Backend response:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Backend request failed."
                );
            }


            if (!data.code) {

                throw new Error(
                    "Gemini returned no code."
                );
            }


            console.log(
                "Gemini response length:",
                data.code.length
            );


            // Parse Gemini response

            const result =
                parseGeminiResponse(data.code);


            generatedHTML =
                result.html;

            generatedCSS =
                result.css;


            console.log(
                "HTML length:",
                generatedHTML.length
            );

            console.log(
                "CSS length:",
                generatedCSS.length
            );


            // Display code

            htmlCode.textContent =
                generatedHTML;

            cssCode.textContent =
                generatedCSS;


            // Render website

            preview.srcdoc =
                createPreviewDocument(
                    generatedHTML,
                    generatedCSS
                );


            // Enable features

            if (downloadButton) {
                downloadButton.disabled = false;
            }

            if (refineButton) {
                refineButton.disabled = false;
            }


            status.textContent =
                "Website generated successfully.";

            previewStatus.textContent =
                "Ready";


        } catch (error) {

            console.error(
                "GENERATION ERROR:",
                error
            );


            status.textContent =
                "Error: " + error.message;

            previewStatus.textContent =
                "Failed";


        } finally {

            generateButton.disabled = false;
        }
    }


    // =========================================
    // PARSE GEMINI RESPONSE
    // =========================================

    function parseGeminiResponse(text) {

        let cleaned = text.trim();


        // Remove Markdown code fences

        cleaned = cleaned.replace(
            /```html/gi,
            ""
        );

        cleaned = cleaned.replace(
            /```css/gi,
            ""
        );

        cleaned = cleaned.replace(
            /```javascript/gi,
            ""
        );

        cleaned = cleaned.replace(
            /```/g,
            ""
        );


        const htmlMarker = "---HTML---";
        const cssMarker = "---CSS---";


        const htmlStart =
            cleaned.indexOf(htmlMarker);

        const cssStart =
            cleaned.indexOf(cssMarker);


        console.log(
            "HTML marker position:",
            htmlStart
        );

        console.log(
            "CSS marker position:",
            cssStart
        );


        // -----------------------------------------
        // EXPECTED FORMAT
        // -----------------------------------------

        if (
            htmlStart !== -1 &&
            cssStart !== -1 &&
            cssStart > htmlStart
        ) {

            const html =
                cleaned.substring(
                    htmlStart + htmlMarker.length,
                    cssStart
                ).trim();


            const css =
                cleaned.substring(
                    cssStart + cssMarker.length
                ).trim();


            if (!html) {
                throw new Error(
                    "Gemini returned empty HTML."
                );
            }


            return {
                html,
                css
            };
        }


        // -----------------------------------------
        // FULL HTML DOCUMENT FALLBACK
        // -----------------------------------------

        const bodyMatch =
            cleaned.match(
                /<body[^>]*>([\s\S]*?)<\/body>/i
            );


        const styleMatch =
            cleaned.match(
                /<style[^>]*>([\s\S]*?)<\/style>/i
            );


        if (bodyMatch) {

            return {

                html:
                    bodyMatch[1].trim(),

                css:
                    styleMatch
                        ? styleMatch[1].trim()
                        : ""
            };
        }


        throw new Error(
            "Could not understand Gemini's response."
        );
    }


    // =========================================
    // CREATE LIVE PREVIEW
    // =========================================

    function createPreviewDocument(
        html,
        css
    ) {

        return `
<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <style>

        ${css}

    </style>

</head>

<body>

    ${html}

</body>

</html>
`;
    }


    // =========================================
    // REFINE WITH AI
    // =========================================

    if (refineButton && refineInput) {

        refineButton.addEventListener(
            "click",
            refineWebsite
        );


        async function refineWebsite() {

            console.log(
                "REFINE BUTTON CLICKED"
            );


            const instruction =
                refineInput.value.trim();


            // Validate instruction

            if (!instruction) {

                status.textContent =
                    "Please describe the change you want.";

                refineInput.focus();

                return;
            }


            // Make sure code exists

            if (
                !generatedHTML ||
                !generatedCSS
            ) {

                status.textContent =
                    "Generate the website first.";

                return;
            }


            refineButton.disabled = true;

            generateButton.disabled = true;


            if (downloadButton) {
                downloadButton.disabled = true;
            }


            status.textContent =
                "Gemini is refining your website...";

            previewStatus.textContent =
                "Refining";


            try {

                console.log(
                    "Sending refinement request..."
                );


                const response =
                    await fetch(
                        "http://127.0.0.1:5000/refine",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                html:
                                    generatedHTML,

                                css:
                                    generatedCSS,

                                instruction:
                                    instruction

                            })
                        }
                    );


                console.log(
                    "Refine response status:",
                    response.status
                );


                const data =
                    await response.json();


                console.log(
                    "Refine response:",
                    data
                );


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        "Refinement request failed."
                    );
                }


                if (!data.code) {

                    throw new Error(
                        "Gemini returned no refined code."
                    );
                }


                // Parse updated code

                const result =
                    parseGeminiResponse(
                        data.code
                    );


                generatedHTML =
                    result.html;

                generatedCSS =
                    result.css;


                // Update code panels

                htmlCode.textContent =
                    generatedHTML;

                cssCode.textContent =
                    generatedCSS;


                // Update live preview

                preview.srcdoc =
                    createPreviewDocument(
                        generatedHTML,
                        generatedCSS
                    );


                // Clear input

                refineInput.value = "";


                // Re-enable download

                if (downloadButton) {
                    downloadButton.disabled = false;
                }


                status.textContent =
                    "Website refined successfully.";

                previewStatus.textContent =
                    "Ready";


            } catch (error) {

                console.error(
                    "REFINE ERROR:",
                    error
                );


                status.textContent =
                    "Error: " + error.message;

                previewStatus.textContent =
                    "Failed";


            } finally {

                refineButton.disabled = false;

                generateButton.disabled = false;
            }
        }
    }


    // =========================================
    // DOWNLOAD PROJECT
    // =========================================

    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            downloadProject
        );


        async function downloadProject() {

            if (
                !generatedHTML ||
                !generatedCSS
            ) {

                status.textContent =
                    "Generate a website first.";

                return;
            }


            if (
                typeof JSZip === "undefined"
            ) {

                status.textContent =
                    "JSZip could not be loaded.";

                return;
            }


            try {

                downloadButton.disabled =
                    true;


                status.textContent =
                    "Creating project ZIP...";


                const zip =
                    new JSZip();


                // ---------------------------------
                // INDEX.HTML
                // ---------------------------------

                const indexHTML =
`<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Generated Website</title>

    <link
        rel="stylesheet"
        href="style.css"
    >

</head>

<body>

${generatedHTML}

</body>

</html>`;


                // ---------------------------------
                // ADD FILES
                // ---------------------------------

                zip.file(
                    "index.html",
                    indexHTML
                );


                zip.file(
                    "style.css",
                    generatedCSS
                );


                // ---------------------------------
                // CREATE ZIP
                // ---------------------------------

                const content =
                    await zip.generateAsync({
                        type: "blob"
                    });


                const url =
                    URL.createObjectURL(
                        content
                    );


                const link =
                    document.createElement("a");


                link.href = url;

                link.download =
                    "screenshot-to-code.zip";


                document.body.appendChild(
                    link
                );


                link.click();


                document.body.removeChild(
                    link
                );


                URL.revokeObjectURL(
                    url
                );


                status.textContent =
                    "Project downloaded successfully.";


            } catch (error) {

                console.error(
                    "DOWNLOAD ERROR:",
                    error
                );


                status.textContent =
                    "Download failed.";


            } finally {

                downloadButton.disabled =
                    false;
            }
        }
    }

});