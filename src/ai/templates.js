/**
 * Nexus AI — Code Template Registry
 */

export const CODE_TEMPLATES = {
  C: {
    hello: {
      code: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
      explanation: 'Uses the `<stdio.h>` library to access `printf` output stream. The program entry starts inside `main` and yields execution code `0` back to the operating system.'
    },
    addition: {
      code: `#include <stdio.h>

int main() {
    int a = 5, b = 10, sum;
    sum = a + b;
    printf("Sum of %d and %d is %d\\n", a, b, sum);
    return 0;
}`,
      explanation: 'Declares integer variables `a`, `b`, and `sum`. Computes the sum using the binary `+` operator and outputs the formatted result.'
    },
    api: {
      code: `#include <stdio.h>
#include <curl/curl.h>

int main() {
    CURL *curl = curl_easy_init();
    if(curl) {
        curl_easy_setopt(curl, CURLOPT_URL, "https://api.nexus.io/v1/ping");
        CURLcode res = curl_easy_perform(curl);
        if(res != CURLE_OK)
            fprintf(stderr, "curl failed: %s\\n", curl_easy_strerror(res));
        curl_easy_cleanup(curl);
    }
    return 0;
}`,
      explanation: 'Initializes a `libcurl` easy handle, sets the endpoint URL, executes the HTTP request, handles errors, and performs cleanup.'
    }
  },

  'C++': {
    hello: {
      code: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`,
      explanation: 'Directs the "Hello, World!" string literal into standard output stream `std::cout` and flushes the line with `std::endl`.'
    },
    addition: {
      code: `#include <iostream>

int main() {
    double num1, num2, sum;
    std::cout << "Enter two numbers: ";
    std::cin >> num1 >> num2;
    sum = num1 + num2;
    std::cout << "Sum: " << sum << std::endl;
    return 0;
}`,
      explanation: 'Reads two double variables from the terminal using `std::cin` stream insertion, adds them, and outputs using `std::cout`.'
    }
  },

  Java: {
    hello: {
      code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      explanation: 'Defines a public class `Main` containing the standard entry method `main`. Writes the greeting to system output stream.'
    },
    addition: {
      code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter first number: ");
        int num1 = scanner.nextInt();
        System.out.print("Enter second number: ");
        int num2 = scanner.nextInt();
        int sum = num1 + num2;
        System.out.println("The sum is: " + sum);
        scanner.close();
    }
}`,
      explanation: 'Instantiates a `Scanner` utility to read keyboard integers, sums them, and outputs to stdout before releasing scanner resources.'
    }
  },

  Python: {
    hello: {
      code: `def greet():
    print("Hello, World!")

if __name__ == "__main__":
    greet()`,
      explanation: 'Defines a helper function `greet` and prints to console. Executes under the script guard block `__name__ == "__main__"`.'
    },
    addition: {
      code: `def add_numbers(a, b):
    return a + b

if __name__ == "__main__":
    num1 = 15
    num2 = 27
    result = add_numbers(num1, num2)
    print(f"The sum of {num1} and {num2} is {result}")`,
      explanation: 'Declares an `add_numbers` function accepting parameters `a` and `b`. Uses Python f-strings for output interpolation.'
    },
    api: {
      code: `import requests

def fetch_data():
    try:
        res = requests.get("https://api.nexus.io/v1/ping", timeout=5)
        res.raise_for_status()
        return res.json()
    except requests.exceptions.RequestException as err:
        print(f"Network error: {err}")
        return None

if __name__ == "__main__":
    data = fetch_data()
    print("Response:", data)`,
      explanation: 'Imports the `requests` library, queries the endpoint, handles network/CORS issues defensively, and parses the JSON body.'
    }
  },

  JavaScript: {
    hello: {
      code: `function main() {
  console.log("Hello, World!");
}

main();`,
      explanation: 'Declares a standard `main` routine that prints a greeting string to the console stream.'
    },
    addition: {
      code: `const add = (a, b) => a + b;

console.log("Sum:", add(5, 7));`,
      explanation: 'Implements an ES6 arrow function implicit return to compute the sum of arguments `a` and `b`.'
    },
    api: {
      code: `async function fetchData(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(\`HTTP error! status: \${res.status}\`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Fetch failed:", error);
    throw error;
  }
}`,
      explanation: 'Utilizes modern async/await syntax to call an endpoint, validates the HTTP response, and handles failures.'
    },
    expressServer: {
      code: `import express from 'express';
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(\`Server active on port \${PORT}\`);
});`,
      explanation: 'Imports the Express framework, configures JSON middleware, registers a health check GET endpoint, and binds port listener.'
    },
    mongodbConnection: {
      code: `import mongoose from 'mongoose';

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus');
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`Connection error: \${error.message}\`);
    process.exit(1);
  }
}`,
      explanation: 'Uses Mongoose to connect asynchronously to MongoDB. Logs the host connection string or handles process exit on failure.'
    },
    jwtMiddleware: {
      code: `import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};`,
      explanation: 'Extracts the JWT Bearer token from authorization headers, verifies the signature, and sets decrypted claims onto `req.user`.'
    }
  },

  'React/JSX': {
    hello: {
      code: `import React from 'react';

export default function HelloWorld() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <h1 className="text-3xl font-extrabold text-cyan-400 animate-pulse">
        Hello, World! 👋
      </h1>
    </div>
  );
}`,
      explanation: 'Constructs a JSX view styled with custom Tailwind utility styles, applying neon text pulse animations.'
    },
    reactComponent: {
      code: `import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center">
      <h2 className="text-2xl font-bold mb-4">Counter</h2>
      <p className="text-4xl text-cyan-400 font-extrabold mb-4">{count}</p>
      <div className="flex gap-4 justify-center">
        <button onClick={() => setCount(count - 1)} className="px-4 py-2 bg-slate-800 rounded">Decrement</button>
        <button onClick={() => setCount(count + 1)} className="px-4 py-2 bg-cyan-500 text-black font-bold rounded">Increment</button>
      </div>
    </div>
  );
}`,
      explanation: 'Standard interactive counter component using React `useState` hooks to manage reactively bound component states.'
    }
  },

  Go: {
    hello: {
      code: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
      explanation: 'Declares package `main`. Imports string formatting utilities `fmt` and prints greeting message.'
    },
    addition: {
      code: `package main

import "fmt"

func add(a int, b int) int {
    return a + b
}

func main() {
    sum := add(12, 34)
    fmt.Printf("Sum is: %d\\n", sum)
}`,
      explanation: "Declares a statically typed addition function returning the sum of integers. Demonstrates short variable declaration ':='."
    }
  },

  Rust: {
    hello: {
      code: `fn main() {
    println!("Hello, World!");
}`,
      explanation: 'Uses macro `println!` to direct a static hello world string directly to system console output.'
    },
    addition: {
      code: `fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    let result = add(45, 55);
    println!("The sum is: {}", result);
}`,
      explanation: 'Features an addition helper with type annotations (`i32`), utilizing the Rust implicit return syntax.'
    }
  },

  SQL: {
    hello: {
      code: `SELECT 'Hello, World!' AS greeting;`,
      explanation: 'Performs a projection query mapping a constant text literal under a column alias `greeting`.'
    },
    addition: {
      code: `SELECT 15 + 25 AS total_sum;`,
      explanation: 'Uses the SQL arithmetic addition operator in projection list to return computed numeric sum.'
    }
  },

  'HTML/CSS': {
    hello: {
      code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Hello World</title>
    <style>
        body { background: #0b0b1e; color: #00f0ff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    </style>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>`,
      explanation: 'Constructs a core HTML5 structure containing nested CSS styling rules designed to center text.'
    }
  }
};

/**
 * Searches the registry for coding matches.
 */
export function lookupTemplate(language, templateType) {
  const langTemplates = CODE_TEMPLATES[language];
  if (!langTemplates) return null;
  return langTemplates[templateType] || null;
}
