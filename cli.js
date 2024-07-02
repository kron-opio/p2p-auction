const readline = require("readline");

class CustomCLI {
  constructor() {
    this.readlineInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async ask(question) {
    return new Promise((resolve) => {
      this.readlineInterface.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  close() {
    this.readlineInterface.close();
  }
}

module.exports = { CustomCLI }
