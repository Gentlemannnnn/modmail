This is a Node.js module used for the Modmailbot found at https://github.com/Dragory/modmailbot.

The module serves to log ticket actions and access them via the "!stats" command. To store the information, it will create a "stats.json" file where the information will be stored and instantly saved.

# Installation


- Clone the repository and navigate to the module folder

- Install the necessary dependencies by running npm install (You need node.js) see Dragory's repository about it.

- Add the module to your project's dependencies by running npm install **/path/to/module**

- During the installation you'll need to install discord.js dependencies used by the module by : 


    ```js
    npm install discord.js
    ```
# Usage
The module exports a function that takes an object containing the following parameters:
- bot: the bot instance
- knex: the knex instance
- config: the bot configuration object
- commands: the modmailbot commands instance
- Here's an example usage:
    ```js
    const modmailStats = require('path/to/modmail-stats');

    modmailStats({
        bot: botInstance,
        knex: knexInstance,
        onfig: botConfig,
        commands: modmailCommandsInstance
    });

    ```


## Contribution

Contributions are always welcome!

Contributions to `this module are welcome! ` Feel free to submit a pull request or open an issue.




## Authors

- [@Dragory](https://github.com/Dragory)
- [@Gentlemannnnn](https://github.com/Gentlemannnnn)

