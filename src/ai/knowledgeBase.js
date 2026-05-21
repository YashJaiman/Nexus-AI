/**
 * Nexus AI — Local Knowledge Base
 */

export const FACTUAL_BASE = {
  // World leaders
  pm_india: {
    title: '🇮🇳 Prime Minister of India',
    content: 'The current Prime Minister of India is **Narendra Modi**, serving since May 26, 2014. He belongs to the Bharatiya Janata Party (BJP) and represents the Varanasi constituency.'
  },
  president_usa: {
    title: '🇺🇸 President of the United States',
    content: 'The current President of the United States is **Donald Trump**, serving his second term after winning the 2024 presidential election. He is the 47th President and a member of the Republican Party.'
  },
  pm_uk: {
    title: '🇬🇧 Prime Minister of the United Kingdom',
    content: 'The current Prime Minister of the United Kingdom is **Keir Starmer**, who took office on July 5, 2024, following the Labour Party\'s general election victory.'
  },

  // Capital cities
  capital_india: 'The capital of India is **New Delhi**. It serves as the seat of all three branches of the Government of India.',
  capital_france: 'The capital of France is **Paris**, which is also the country\'s most populous city and a major global center for commerce and culture.',
  capital_usa: 'The capital of the United States is **Washington, D.C.**, situated on the Potomac River bordering Maryland and Virginia.',
  capital_uk: 'The capital of the United Kingdom is **London**, a major global financial and cultural hub located on the River Thames.',
  capital_japan: 'The capital of Japan is **Tokyo**, the world\'s most populous metropolitan area and center of Japanese commerce.',

  // Programming Concepts
  closure: {
    title: 'JavaScript Closures',
    content: 'A **closure** is the combination of a function bundled together with references to its surrounding state (the lexical environment). In JavaScript, closures are created every time a function is created, at function creation time. It allows an inner function to access scope boundaries from an outer function even after the outer function has returned.\n\n**Example:**\n```javascript\nfunction outer() {\n  let count = 0;\n  return function inner() {\n    count++;\n    return count;\n  };\n}\nconst counter = outer();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\n```'
  },
  promise: {
    title: 'JavaScript Promises',
    content: 'A **Promise** is an object representing the eventual completion or failure of an asynchronous operation. It has three states:\n* `pending`: initial state, neither fulfilled nor rejected.\n* `fulfilled`: operation completed successfully.\n* `rejected`: operation failed.\n\n**Example:**\n```javascript\nconst myPromise = new Promise((resolve, reject) => {\n  setTimeout(() => resolve("Done!"), 1000);\n});\nmyPromise.then(result => console.log(result));\n```'
  },
  virtual_dom: {
    title: 'React Virtual DOM',
    content: 'The **Virtual DOM** (VDOM) is a programming concept where an ideal, or "virtual", representation of a UI is kept in memory and synced with the "real" DOM by a library such as ReactDOM. This process is called reconciliation. It enables declarative API structures in React.'
  },
  event_loop: {
    title: 'Node.js Event Loop',
    content: 'The **Event Loop** allows Node.js to perform non-blocking I/O operations despite JavaScript being single-threaded, by offloading operations to the system kernel whenever possible. It coordinates execution phases, timers, callbacks, poll operations, and check states.'
  },
  middleware: {
    title: 'Express Middlewares',
    content: 'Middleware functions are functions that have access to the request object (`req`), the response object (`res`), and the next middleware function in the application\'s request-response cycle. They perform operations such as executing code, changing objects, or ending cycles.\n\n**Example:**\n```javascript\napp.use((req, res, next) => {\n  console.log(`${req.method} ${req.url}`);\n  next();\n});\n```'
  },
  hooks: {
    title: 'React Hooks',
    content: '**React Hooks** are functions that let you "hook into" React state and lifecycle features from function components. Key hooks include:\n* `useState` — adds local state to a component\n* `useEffect` — runs side effects after render\n* `useContext` — accesses context values\n* `useRef` — persists mutable values across renders\n* `useMemo` / `useCallback` — memoization for performance\n\nHooks follow two rules: only call at the top level, and only call from React functions.'
  },
  rest_api: {
    title: 'REST API',
    content: '**REST** (Representational State Transfer) is an architectural style for building web services. RESTful APIs use standard HTTP methods:\n* `GET` — retrieve data\n* `POST` — create new resources\n* `PUT` — update existing resources\n* `DELETE` — remove resources\n\nREST APIs are stateless, cacheable, and use a uniform interface with resource-based URIs.'
  },
  mongodb_indexes: {
    title: 'MongoDB Indexes',
    content: '**MongoDB indexes** support efficient execution of queries. Without indexes, MongoDB performs a collection scan. Key index types:\n* **Single Field** — index on one field\n* **Compound** — index on multiple fields\n* **Text** — supports text search queries\n* **Hashed** — supports hash-based sharding\n\n**Example:**\n```javascript\ndb.collection.createIndex({ email: 1 }); // ascending\n```'
  },

  // HTTP status codes
  http_200: '`200 OK`: Request succeeded. The payload is fetched and returned.',
  http_201: '`201 Created`: Request succeeded and a new resource was created.',
  http_400: '`400 Bad Request`: Server cannot process request due to client side validation failures.',
  http_401: '`401 Unauthorized`: Authentication is required and has failed or not been provided.',
  http_403: '`403 Forbidden`: Client does not have access rights to the content.',
  http_404: '`404 Not Found`: Server cannot find the requested resource.',
  http_429: '`429 Too Many Requests`: Client has sent too many requests in a given amount of time ("rate limiting").',
  http_500: '`500 Internal Server Error`: Server encountered a condition it does not know how to handle.',

  // Databases
  indexes: {
    title: 'Database Indexes',
    content: 'A database **index** is a data structure (typically B-Tree or Hash) that improves the speed of data retrieval operations on a database table at the cost of additional writes and storage space. It avoids scanning every row in the table (full table scan).'
  },
  sql_nosql: {
    title: 'SQL vs NoSQL Databases',
    content: '**SQL Databases** (Relational) are table-based, structured with schemas, and scale vertically (e.g. PostgreSQL, MySQL). They enforce ACID compliance.\n\n**NoSQL Databases** (Non-relational) are document-based, key-value, graph, or column-oriented, scale horizontally (e.g. MongoDB, Redis), and offer flexible schemas.'
  }
};

/**
 * Searches the local knowledge base for matches based on keywords in prompt.
 */
export function lookupKnowledge(sanitizedPrompt) {
  // World leaders
  if (sanitizedPrompt.includes('pm of india') || sanitizedPrompt.includes('prime minister of india') || sanitizedPrompt.includes('modi')) {
    return FACTUAL_BASE.pm_india;
  }
  if (sanitizedPrompt.includes('president of us') || sanitizedPrompt.includes('president of america') || sanitizedPrompt.includes('president of usa') || sanitizedPrompt.includes('trump')) {
    return FACTUAL_BASE.president_usa;
  }
  if (sanitizedPrompt.includes('pm of uk') || sanitizedPrompt.includes('prime minister of uk') || sanitizedPrompt.includes('starmer')) {
    return FACTUAL_BASE.pm_uk;
  }

  // Capitals
  if (sanitizedPrompt.includes('capital of india')) return { title: 'Capital of India', content: FACTUAL_BASE.capital_india };
  if (sanitizedPrompt.includes('capital of france')) return { title: 'Capital of France', content: FACTUAL_BASE.capital_france };
  if (sanitizedPrompt.includes('capital of us') || sanitizedPrompt.includes('capital of america') || sanitizedPrompt.includes('capital of usa')) return { title: 'Capital of USA', content: FACTUAL_BASE.capital_usa };
  if (sanitizedPrompt.includes('capital of uk') || sanitizedPrompt.includes('capital of england')) return { title: 'Capital of UK', content: FACTUAL_BASE.capital_uk };
  if (sanitizedPrompt.includes('capital of japan')) return { title: 'Capital of Japan', content: FACTUAL_BASE.capital_japan };

  // Programming concepts
  if (sanitizedPrompt.includes('closure')) return FACTUAL_BASE.closure;
  if (sanitizedPrompt.includes('promise')) return FACTUAL_BASE.promise;
  if (sanitizedPrompt.includes('virtual dom') || sanitizedPrompt.includes('vdom')) return FACTUAL_BASE.virtual_dom;
  if (sanitizedPrompt.includes('event loop')) return FACTUAL_BASE.event_loop;
  if (sanitizedPrompt.includes('middleware')) return FACTUAL_BASE.middleware;
  if (/\bhook/.test(sanitizedPrompt) && (sanitizedPrompt.includes('react') || sanitizedPrompt.includes('use'))) return FACTUAL_BASE.hooks;
  if (sanitizedPrompt.includes('rest api') || sanitizedPrompt.includes('restful')) return FACTUAL_BASE.rest_api;
  if (sanitizedPrompt.includes('mongodb index') || sanitizedPrompt.includes('mongo index')) return FACTUAL_BASE.mongodb_indexes;

  // HTTP Codes
  if (sanitizedPrompt.includes('status code') || sanitizedPrompt.includes('http status') || sanitizedPrompt.includes('http code')) {
    const codeMatch = sanitizedPrompt.match(/\b(200|201|400|401|403|404|429|500)\b/);
    if (codeMatch) {
      const codeKey = `http_${codeMatch[1]}`;
      return { title: `HTTP Status ${codeMatch[1]}`, content: FACTUAL_BASE[codeKey] };
    }
  }

  // Databases
  if (sanitizedPrompt.includes('database index') || sanitizedPrompt.includes('db index') || sanitizedPrompt.includes('indexing')) return FACTUAL_BASE.indexes;
  if (sanitizedPrompt.includes('sql vs nosql') || sanitizedPrompt.includes('nosql vs sql') || sanitizedPrompt.includes('sql or nosql')) return FACTUAL_BASE.sql_nosql;

  return null;
}
