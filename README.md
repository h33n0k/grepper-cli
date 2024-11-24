# Grepper CLI

`grepper-cli` is a command-line tool for fetching and displaying code snippets from the [Grepper API](https://www.grepper.com/). Designed for developers who want quick access to solutions without leaving their terminal.

## Demo
![demo](doc/images/demo.gif)

## Requirements
- [Grepper Account](https://www.grepper.com/)
- [Grepper API Key](https://www.grepper.com/app/settings-account.php)

## Installation
See the [Releases](https://github.com/h33n0k/grepper-cli/releases) section.

---

### Manage Configuration
```bash
grepper config # output current config
grepper config [param] # output current config param
grepper config [param] [value] # define config param value
```
#### Example :
```bash
grepper config api_key <your_api_key>
```

---

### Fetch Answers
```bash
grepper # interactive
grepper -q 'http status codes' # specified args
echo convert string to integer in python | grepper # piped input
```
#### Options :

```bash
-q, --query # [string] your grepper query
-l, --limit # [number] answers limit
-f, -format # [string] output format (pretty, json)
--nocache # [boolean] do not use cached results nor previous prompts
```
---

## Feedback
- If you get an issue or come up with an awesome idea, don't hesitate to open an issue in github.
- If you think this plugin is useful or cool, consider rewarding it a star.

## LICENSE
The project is licensed under a MIT license. See [LICENSE](LICENSE) file for details.
