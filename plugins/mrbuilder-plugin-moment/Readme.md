mrbuilder-plugin-moment
===
This plugin is designed to be used with [mrbuilder](https://github.com/jspears/mrbuilder).

## Installation
```sh
  $ yarn add "mrbuilder-plugin-moment" -D
```
## Configuration
In package.json
```json
{
 "name":"your_component"
 ...
 "mrbuilder":{
    "plugins":[
      ["mrbuilder-plugin-moment", {

        "languages":["en", "ru"] //include these languages
      }]
    ]

 }
}
```
