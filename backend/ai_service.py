import os
import time

from dotenv import load_dotenv
from google import genai
from PIL import Image

from prompts import SCREENSHOT_TO_CODE_PROMPT


# =========================================
# ENVIRONMENT
# =========================================

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "GEMINI_API_KEY is missing from .env"
    )


# =========================================
# GEMINI CLIENT
# =========================================

client = genai.Client(
    api_key=api_key
)


# Model that is currently working for the project
MODEL = "gemini-3.5-flash-lite"


# =========================================
# GENERATE CODE
# =========================================

def generate_code(image_path):

    print("\nSending screenshot to Gemini...")


    image = Image.open(image_path)


    # Retry several times if Gemini temporarily
    # returns a 503 capacity error.

    max_attempts = 4


    for attempt in range(1, max_attempts + 1):

        try:

            print(
                f"Gemini attempt {attempt}/{max_attempts}"
            )


            response = client.models.generate_content(
                model=MODEL,
                contents=[
                    SCREENSHOT_TO_CODE_PROMPT,
                    image
                ]
            )


            generated_text = response.text


            if not generated_text:

                raise ValueError(
                    "Gemini returned an empty response."
                )


            print("Gemini generation successful.")

            print(
                "Generated characters:",
                len(generated_text)
            )


            return generated_text


        except Exception as error:

            error_message = str(error)


            print(
                f"Gemini attempt {attempt} failed:"
            )

            print(error_message)


            # Retry only for temporary server errors

            if (
                "503" in error_message
                or "UNAVAILABLE" in error_message
                or "high demand" in error_message.lower()
            ):

                if attempt < max_attempts:

                    wait_time = 2 ** attempt

                    print(
                        f"Retrying in {wait_time} seconds..."
                    )

                    time.sleep(wait_time)

                    continue


            # If it isn't a temporary 503,
            # or all retries failed, stop.

            raise


    raise RuntimeError(
        "Gemini request failed after all retries."
    )


# =========================================
# REFINE EXISTING CODE
# =========================================

def refine_code(html, css, instruction):

    prompt = f"""
You are an expert frontend developer.

Here is the current website.

---HTML---
{html}

---CSS---
{css}

The user wants this change:

{instruction}

Modify the existing website according to the
user's request.

Rules:

- Preserve the existing design unless the
  instruction requires a change.
- Return complete updated HTML.
- Return complete updated CSS.
- Do not return JavaScript.
- Do not explain anything.

Return exactly:

---HTML---
[complete HTML]

---CSS---
[complete CSS]
"""


    max_attempts = 4


    for attempt in range(1, max_attempts + 1):

        try:

            print(
                f"Gemini refinement attempt "
                f"{attempt}/{max_attempts}"
            )


            response = client.models.generate_content(
                model=MODEL,
                contents=prompt
            )


            generated_text = response.text


            if not generated_text:

                raise ValueError(
                    "Gemini returned an empty response."
                )


            print(
                "Gemini refinement successful."
            )


            return generated_text


        except Exception as error:

            error_message = str(error)


            print(
                "Refinement error:"
            )

            print(error_message)


            if (
                "503" in error_message
                or "UNAVAILABLE" in error_message
                or "high demand" in error_message.lower()
            ):

                if attempt < max_attempts:

                    wait_time = 2 ** attempt

                    print(
                        f"Retrying in {wait_time} seconds..."
                    )

                    time.sleep(wait_time)

                    continue


            raise


    raise RuntimeError(
        "Gemini refinement failed after all retries."
    )