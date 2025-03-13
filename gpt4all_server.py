from gpt4all import GPT4All

# Load the GPT4All model
model = GPT4All("ggml-gpt4all-j-v1.3-groovy")  # You can choose a different model

def generate_response(prompt):
    # Generate a response using GPT4All
    response = model.generate(prompt)
    return response

if __name__ == "__main__":
    import sys
    import json

    # Read input from stdin
    input_data = sys.stdin.read()
    data = json.loads(input_data)

    # Generate a response
    response = generate_response(data["prompt"])

    # Return the response as JSON
    print(json.dumps({"response": response}))