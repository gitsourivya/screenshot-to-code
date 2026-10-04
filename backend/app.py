from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

import os

from ai_service import generate_code, refine_code


# =========================================
# FLASK SETUP
# =========================================

app = Flask(__name__)

CORS(app)


# =========================================
# UPLOAD CONFIGURATION
# =========================================

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# =========================================
# HOME ROUTE
# =========================================

@app.route("/", methods=["GET"])
def home():
    return "Screenshot-to-Code backend is running!"


# =========================================
# SCREENSHOT → CODE
# =========================================

@app.route("/upload", methods=["POST"])
def upload_image():

    print("\n========================================")
    print("NEW SCREENSHOT REQUEST")
    print("========================================")


    # -----------------------------------------
    # Check image
    # -----------------------------------------

    if "image" not in request.files:

        print("ERROR: No image field found.")

        return jsonify({
            "error": "No image uploaded."
        }), 400


    image = request.files["image"]


    # -----------------------------------------
    # Check filename
    # -----------------------------------------

    if image.filename == "":

        print("ERROR: No filename.")

        return jsonify({
            "error": "No image selected."
        }), 400


    # -----------------------------------------
    # Check MIME type
    # -----------------------------------------

    if not image.mimetype.startswith("image/"):

        print("ERROR: Uploaded file is not an image.")

        return jsonify({
            "error": "Only image files are allowed."
        }), 400


    # -----------------------------------------
    # Secure filename
    # -----------------------------------------

    filename = secure_filename(image.filename)

    file_path = os.path.join(
        app.config["UPLOAD_FOLDER"],
        filename
    )


    # -----------------------------------------
    # Save image
    # -----------------------------------------

    try:

        image.save(file_path)

        print("Image saved:")
        print(file_path)


    except Exception as error:

        print("ERROR SAVING IMAGE:")
        print(error)

        return jsonify({
            "error": "Could not save uploaded image."
        }), 500


    # -----------------------------------------
    # Send image to Gemini
    # -----------------------------------------

    try:

        print("\nSending screenshot to Gemini...")

        generated_code = generate_code(file_path)


        # -------------------------------------
        # Check Gemini response
        # -------------------------------------

        if not generated_code:

            raise ValueError(
                "Gemini returned an empty response."
            )


        print("\nGemini generation successful.")

        print(
            "Generated characters:",
            len(generated_code)
        )


        # -------------------------------------
        # Delete temporary image
        # -------------------------------------

        if os.path.exists(file_path):

            os.remove(file_path)

            print("Temporary screenshot deleted.")


        # -------------------------------------
        # Return result
        # -------------------------------------

        return jsonify({

            "message":
                "Screenshot processed successfully.",

            "code":
                generated_code

        }), 200


    except Exception as error:

        print("\n========================================")
        print("GEMINI GENERATION ERROR")
        print("========================================")

        print(
            "Error type:",
            type(error).__name__
        )

        print(
            "Error:",
            str(error)
        )


        # Delete temporary image
        if os.path.exists(file_path):

            os.remove(file_path)

            print("Temporary screenshot deleted.")


        return jsonify({

            "error":
                str(error)

        }), 500


# =========================================
# REFINE EXISTING WEBSITE
# =========================================

@app.route("/refine", methods=["POST"])
def refine():

    print("\n========================================")
    print("NEW REFINEMENT REQUEST")
    print("========================================")


    # -----------------------------------------
    # Read JSON body
    # -----------------------------------------

    data = request.get_json()


    if not data:

        print("ERROR: No JSON data received.")

        return jsonify({
            "error": "No data received."
        }), 400


    # -----------------------------------------
    # Extract values
    # -----------------------------------------

    html = data.get("html", "")

    css = data.get("css", "")

    instruction = data.get(
        "instruction",
        ""
    ).strip()


    # -----------------------------------------
    # Validate HTML
    # -----------------------------------------

    if not html:

        return jsonify({
            "error": "HTML is required."
        }), 400


    # -----------------------------------------
    # Validate CSS
    # -----------------------------------------

    if not css:

        return jsonify({
            "error": "CSS is required."
        }), 400


    # -----------------------------------------
    # Validate instruction
    # -----------------------------------------

    if not instruction:

        return jsonify({
            "error": "Please enter an instruction."
        }), 400


    print("User instruction:")
    print(instruction)


    # -----------------------------------------
    # Ask Gemini to refine
    # -----------------------------------------

    try:

        print("\nSending website to Gemini for refinement...")

        updated_code = refine_code(
            html,
            css,
            instruction
        )


        # -------------------------------------
        # Check response
        # -------------------------------------

        if not updated_code:

            raise ValueError(
                "Gemini returned an empty response."
            )


        print("\nRefinement successful.")

        print(
            "Updated characters:",
            len(updated_code)
        )


        # -------------------------------------
        # Return updated code
        # -------------------------------------

        return jsonify({

            "message":
                "Website refined successfully.",

            "code":
                updated_code

        }), 200


    except Exception as error:

        print("\n========================================")
        print("GEMINI REFINEMENT ERROR")
        print("========================================")

        print(
            "Error type:",
            type(error).__name__
        )

        print(
            "Error:",
            str(error)
        )


        return jsonify({

            "error":
                str(error)

        }), 500


# =========================================
# START SERVER
# =========================================

if __name__ == "__main__":

    print("")
    print("========================================")
    print("       SCREENSHOT-TO-CODE BACKEND")
    print("========================================")
    print("Server: http://127.0.0.1:5000")
    print("Upload: POST /upload")
    print("Refine: POST /refine")
    print("========================================")
    print("")


    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )