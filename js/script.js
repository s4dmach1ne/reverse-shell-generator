// Element selectors
const ipInput = document.querySelector("#ip");
const portInput = document.querySelector("#port");
const listenerSelect = document.querySelector("#listener-selection");
const shellSelect = document.querySelector("#shell");
// const autoCopySwitch = document.querySelector("#auto-copy-switch");
const operatingSystemSelect = document.querySelector("#os-options");
const encodingSelect = document.querySelector('#encoding');
const searchBox = document.querySelector('#searchBox');
const listenerCommand = document.querySelector("#listener-command");
const reverseShellCommand = document.querySelector("#reverse-shell-command");
const bindShellCommand = document.querySelector("#bind-shell-command");
const msfVenomCommand = document.querySelector("#msfvenom-command");
const hoaxShellCommand = document.querySelector("#hoaxshell-command");

const FilterOperatingSystemType = {
    'All': 'all',
    'Windows': 'windows',
    'Linux': 'linux',
    'Mac': 'mac'
};

const hoaxshell_listener_types = {
	"Windows CMD cURL" : "cmd-curl",
	"PowerShell IEX" : "ps-iex",
	"PowerShell IEX Constr Lang Mode" : "ps-iex-cm",
	"PowerShell Outfile" : "ps-outfile",
	"PowerShell Outfile Constr Lang Mode" : "ps-outfile-cm",
	"Windows CMD cURL https" : "cmd-curl -c /your/cert.pem -k /your/key.pem",
	"PowerShell IEX https" : "ps-iex -c /your/cert.pem -k /your/key.pem",
	"PowerShell IEX Constr Lang Mode https" : "ps-iex-cm -c /your/cert.pem -k /your/key.pem",
	"PowerShell Outfile https" : "ps-outfile -c /your/cert.pem -k /your/key.pem",
	"PowerShell Outfile Constr Lang Mode https" : "ps-outfile-cm -c /your/cert.pem -k /your/key.pem"
};

// new
function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}


operatingSystemSelect.addEventListener("change", (event) => {
    const selectedOS = event.target.value;
    rsg.setState({
        filterOperatingSystem: selectedOS,
    });
});

document.querySelector("#reverse-tab").addEventListener("click", () => {
    rsg.setState({ commandType: CommandType.ReverseShell });
});

document.querySelector("#bind-tab").addEventListener("click", () => {
    rsg.setState({ commandType: CommandType.BindShell });
});

document.querySelector("#msfvenom-tab").addEventListener("click", () => {
    rsg.setState({ commandType: CommandType.MSFVenom });
});

document.querySelector("#hoaxshell-tab").addEventListener("click", () => {
    rsg.setState({ commandType: CommandType.HoaxShell });
});

const filterCommandData = function (data, { commandType, filterOperatingSystem = FilterOperatingSystemType.All, filterText = '' }) {
    return data.filter(item => {

        if (!item.meta.includes(commandType)) {
            return false;
        }

        var hasOperatingSystemMatch = (filterOperatingSystem === FilterOperatingSystemType.All) || item.meta.includes(filterOperatingSystem);
        var hasTextMatch = item.name.toLowerCase().indexOf(filterText.toLowerCase()) >= 0;
        return hasOperatingSystemMatch && hasTextMatch;
    });
}

const query = new URLSearchParams(location.hash.substring(1));

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
const fixedEncodeURIComponent = function (str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
        return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
}

const parsePortOrDefault = function (value, defaultPort = 9001) {
    if (value === null || value === undefined) return defaultPort;

    const number = Number(value);
    const isValidPort = (Number.isSafeInteger(number) && number >= 0 && number <= 65535);
    return isValidPort ? number : defaultPort;
};

const rsg = {
    ip: (query.get('ip') || localStorage.getItem('ip') || '10.10.14.10').replace(/[^a-zA-Z0-9.\-]/g, ''),
    port: parsePortOrDefault(query.get('port') || localStorage.getItem('port')),
    payload: query.get('payload') || localStorage.getItem('payload') || 'windows/x64/meterpreter/reverse_tcp',
    payload: query.get('type') || localStorage.getItem('type') || 'cmd-curl',
    shell: query.get('shell') || localStorage.getItem('shell') || rsgData.shells[0],
    listener: query.get('listener') || localStorage.getItem('listener') || rsgData.listenerCommands[0][1],
    encoding: query.get('encoding') || localStorage.getItem('encoding') || 'None',
    selectedValues: {
        [CommandType.ReverseShell]: filterCommandData(rsgData.reverseShellCommands, { commandType: CommandType.ReverseShell })[0].name,
        [CommandType.BindShell]: filterCommandData(rsgData.reverseShellCommands, { commandType: CommandType.BindShell })[0].name,
        [CommandType.MSFVenom]: filterCommandData(rsgData.reverseShellCommands, { commandType: CommandType.MSFVenom })[0].name,
        [CommandType.HoaxShell]: filterCommandData(rsgData.reverseShellCommands, { commandType: CommandType.HoaxShell })[0].name,
    },
    commandType: CommandType.ReverseShell,
    filterOperatingSystem: query.get('filterOperatingSystem') || localStorage.getItem('filterOperatingSystem') || FilterOperatingSystemType.All,
    filterText: query.get('filterText') || localStorage.getItem('filterText') || '',

    // uiElements: {
    //     [CommandType.ReverseShell]: {
    //         listSelection: '#reverse-shell-selection',
    //         command: '#reverse-shell-command'
    //     },
    //     [CommandType.BindShell]: {
    //         listSelection: '#bind-shell-selection',
    //         command: '#bind-shell-command',
    //     },
    //     [CommandType.MSFVenom]: {
    //         listSelection: '#msfvenom-selection',
    //         command: '#msfvenom-command'
    //     },
    //     [CommandType.HoaxShell]: {
    //         listSelection: '#hoaxshell-selection',
    //         command: '#hoaxshell-command'
    //     }
    // },

    uiElements: {
        listSelection: '#shell-selection'
    },



    copyToClipboard: (text) => {
        if (navigator ?.clipboard ?.writeText) {
            navigator.clipboard.writeText(text)
            $('#clipboard-toast').toast('show')
        } else if (window ?.clipboardData ?.setData) {
            window.clipboardData.setData('Text', text);
            $('#clipboard-toast').toast('show')
        } else {
            $('#clipboard-failure-toast').toast('show')
        }
    },

    escapeHTML: (text) => {
        let element = document.createElement('p');
        element.textContent = text;
        return element.innerHTML;
    },

    getIP: () => rsg.ip,

    getPort: () => parsePortOrDefault(rsg.port),

    getShell: () => rsg.shell,

    getEncoding: () => rsg.encoding,

    getSelectedCommandName: () => {
        return rsg.selectedValues[rsg.commandType];
    },

    getReverseShellCommand: () => {
        const reverseShellData = rsgData.reverseShellCommands.find((item) => item.name === rsg.getSelectedCommandName());
        return reverseShellData.command;
    },

    getPayload: () => {
        if (rsg.commandType === 'MSFVenom') {
            let cmd = rsg.getReverseShellCommand();
            // msfvenom -p windows/x64/meterpreter_reverse_tcp ...
            let regex = /\s+-p\s+(?<payload>[a-zA-Z0-9/_]+)/;
            let match = regex.exec(cmd);
            if (match) {
                return match.groups.payload;
            }
        }

        return 'windows/x64/meterpreter/reverse_tcp'

    },

    getType: () => {
        if (rsg.commandType === 'HoaxShell') {
            let cmd_name = rsg.getSelectedCommandName();
            return hoaxshell_listener_types[cmd_name];
        }

        return 'cmd-curl'

    },

    generateReverseShellCommand: () => {
        let command

        if (rsg.getSelectedCommandName() === 'PowerShell #3 (Base64)') {
            const encoder = (text) => text;
            const payload = rsg.insertParameters(rsgData.specialCommands['PowerShell payload'], encoder)
                command = "powershell -e " + btoa(toBinary(payload))
            function toBinary(string) {
                const codeUnits = new Uint16Array(string.length);
                for (let i = 0; i < codeUnits.length; i++) {
                codeUnits[i] = string.charCodeAt(i);
                }
                const charCodes = new Uint8Array(codeUnits.buffer);
                let result = '';
                for (let i = 0; i < charCodes.byteLength; i++) {
                result += String.fromCharCode(charCodes[i]);
                }
                return result;
            }
        } else {
            command = rsg.getReverseShellCommand()
        }

        const encoding = rsg.getEncoding();
        if (encoding === 'Base64') {
            command = rsg.insertParameters(command, (text) => text)
            command = btoa(command)
        } else {
            function encoder(string) {
                let result = string;
                switch (encoding) {
                    case 'encodeURLDouble':
                        result = fixedEncodeURIComponent(result);
                        // fall-through
                    case 'encodeURL':
                        result = fixedEncodeURIComponent(result);
                        break;
                }
                return result;
            }
            command = rsg.escapeHTML(encoder(command));
            // NOTE: Assumes encoder doesn't produce HTML-escaped characters in parameters
            command = rsg.insertParameters(rsg.highlightParameters(command, encoder), encoder);
        }
        return command;
    },

    highlightParameters: (text, encoder) => {
        const parameters = ['{ip}', '{port}', '{shell}', encodeURI('{ip}'), encodeURI('{port}'),
            encodeURI('{shell}')
        ];

        parameters.forEach((param) => {
            if (encoder) param = encoder(param)
            text = text.replace(param, `<span class="highlighted-parameter">${param}</span>`)

            .replaceAll(rsg.getIP(), `<span class="highlighted-parameter">${rsg.getIP()}</span>`)
            .replaceAll(String(rsg.getPort()), `<span class="highlighted-parameter">${rsg.getPort()}</span>`)
            .replaceAll(
              new RegExp(`${rsg.getShell().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'
            ), 
            `<span class="highlighted-parameter">${rsg.getShell()}</span>`
            );



        })
        return text
        
    },

    init: () => {
        rsg.initListenerSelection()
        rsg.initShells()
    },

    initListenerSelection: () => {
        rsgData.listenerCommands.forEach((listenerData, i) => {
            const type = listenerData[0];
            const command = listenerData[1];

            const option = document.createElement("option");

            option.value = command;
            option.selected = rsg.listener === option.value;
            option.classList.add("listener-option");
            option.innerText = type;

            listenerSelect.appendChild(option);
        })
    },

    initShells: () => {
        rsgData.shells.forEach((shell, i) => {
            const option = document.createElement("option");

            option.selected = rsg.shell === shell;
            option.classList.add("shell-option");
            option.innerText = shell;

            shellSelect.appendChild(option);
        })
    },

    // Updates the rsg state, and forces a re-render
    setState: (newState = {}) => {
        Object.keys(newState).forEach((key) => {
            const value = newState[key];
            rsg[key] = value;
            localStorage.setItem(key, value)
        });
        Object.assign(rsg, newState);

        rsg.update();
    },

    insertParameters: (command, encoder) => {
        if (!command || !encoder) return '';
        
        let ip = encoder('{ip}');
        let port = encoder('{port}');
        let shell = encoder('{shell}');

        return command
            .replaceAll(ip, encoder(rsg.getIP()))
            .replaceAll(port, encoder(String(rsg.getPort())))
            .replaceAll(shell, encoder(rsg.getShell()));
    },

    update: () => {
        rsg.updateTabList() 
        rsg.updateListenerCommand()
        // rsg.updateReverseShellCommand()
        rsg.updateValues()
    },

    updateValues: () => {
        const listenerOptions = listenerSelect.querySelectorAll(".listener-option");
        listenerOptions.forEach((option)  => {
            option.selected = rsg.listener === option.value;
        });

        const shellOptions = shellSelect.querySelectorAll(".shell-option");
        shellOptions.forEach((option) => {
            option.selected = rsg.shell === option.value;
        });

        const encodingOptions = encodingSelect.querySelectorAll("option");
        encodingOptions.forEach((option) => {
            option.selected = rsg.encoding === option.value;
        });

        ipInput.value = rsg.ip;
        portInput.value = rsg.port;
        operatingSystemSelect.value = rsg.filterOperatingSystem;
        searchBox.value = rsg.filterText;
    },


    updateTabList: () => {
      const data = rsgData.reverseShellCommands;
      const filteredItems = filterCommandData(
        data,
        {
          filterOperatingSystem: rsg.filterOperatingSystem,
          filterText: rsg.filterText,
          commandType: rsg.commandType
        }
      );

      const documentFragment = document.createDocumentFragment();
      if (filteredItems.length === 0) {
        const emptyMessage = document.createElement("button");
        emptyMessage.innerText = "No results found";
        emptyMessage.classList.add("list-group-item", "list-group-item-action", "disabled");
        documentFragment.appendChild(emptyMessage);
      }

        filteredItems.forEach((item) => {
          const { name, command } = item;
          // if (!command) return;


          const container = document.createElement("div");
          container.classList.add("list-group-item", "list-group-item-action");

          // Header bar with Name + Copy button
          const headerWrapper = document.createElement("div");
          headerWrapper.classList.add("d-flex", "justify-content-between", "align-items-center", "mb-2");

          const nameElement = document.createElement("div");
          nameElement.textContent = name;
          nameElement.classList.add("namecmd");

          const copyButton = document.createElement("button");
          copyButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-xs"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 5C7 3.34315 8.34315 2 10 2H19C20.6569 2 22 3.34315 22 5V14C22 15.6569 20.6569 17 19 17H17V19C17 20.6569 15.6569 22 14 22H5C3.34315 22 2 20.6569 2 19V10C2 8.34315 3.34315 7 5 7H7V5ZM9 7H14C15.6569 7 17 8.34315 17 10V15H19C19.5523 15 20 14.5523 20 14V5C20 4.44772 19.5523 4 19 4H10C9.44772 4 9 4.44772 9 5V7ZM5 9C4.44772 9 4 9.44772 4 10V19C4 19.5523 4.44772 20 5 20H14C14.5523 20 15 19.5523 15 19V10C15 9.44772 14.5523 9 14 9H5Z" fill="currentColor"></path></svg>';          copyButton.classList.add("btn", "btn-sm", "btn-outline-light");

          // Pre block that shows the final command
          const commandPre = document.createElement("pre");
          commandPre.classList.add(
            "bg-dark", "border", "pre-wrap", "text-break",
            "p-4", "pl-5", "text-white", "mt-2", "rounded", "reverse-shell-command"
          );

          // The main encoding + highlighting logic:
          let highlighted;

          const encoding = rsg.getEncoding();

          if (encoding === 'Base64') {
            let inserted = rsg.insertParameters(command, text => text);
            highlighted = btoa(inserted);

          } else {
            function encoder(str) {
              let result = str;
              switch (encoding) {
                case 'encodeURLDouble':
                  result = fixedEncodeURIComponent(result);
                case 'encodeURL':
                  result = fixedEncodeURIComponent(result);
                  break;
              }
              return result;
            }

            let encoded = encoder(command);
            let escaped = rsg.escapeHTML(encoded);
            highlighted = rsg.insertParameters(
              rsg.highlightParameters(escaped, encoder),
              encoder
            );
          }


          if (name === 'PowerShell #3 (Base64)') {
            const encoder = (text) => text;
            const payload = rsg.insertParameters(rsgData.specialCommands['PowerShell payload'], encoder);
            highlighted = "powershell -e " + btoa(toBinary(payload));

            function toBinary(string) {
              const codeUnits = new Uint16Array(string.length);
              for (let i = 0; i < codeUnits.length; i++) {
                codeUnits[i] = string.charCodeAt(i);
              }
              const charCodes = new Uint8Array(codeUnits.buffer);
              let result = '';
              for (let i = 0; i < charCodes.byteLength; i++) {
                result += String.fromCharCode(charCodes[i]);
              }
              return result;
            }
          }


          commandPre.innerHTML = highlighted;

          // Copy button: copies the plain text version (no HTML tags)
          copyButton.addEventListener("click", () => {
            const textToCopy = commandPre.innerText
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&amp;/g, "&");

            navigator.clipboard.writeText(textToCopy).then(() => {
              copyButton.classList.add("btn-success");
              setTimeout(() => copyButton.classList.remove("btn-success"), 1000);
            });
          });

          headerWrapper.appendChild(nameElement);
          headerWrapper.appendChild(copyButton);
          container.appendChild(headerWrapper);
          container.appendChild(commandPre);
          documentFragment.appendChild(container);
      });

    const listSelectionSelector = rsg.uiElements.listSelection;
        const containerElement = document.querySelector(listSelectionSelector);
        if (containerElement) {
            containerElement.innerHTML = '';
            containerElement.appendChild(documentFragment);
        }
    },



    updateListenerCommand: () => {
        const privilegeWarning = document.querySelector("#port-privileges-warning");
        let command = listenerSelect.value;
        command = rsg.highlightParameters(command)
        command = command.replace('{port}', rsg.getPort())
        command = command.replace('{ip}', rsg.getIP())
        command = command.replace('{payload}', rsg.getPayload())
        command = command.replace('{type}', rsg.getType())

        if (rsg.getPort() < 1024) {
            privilegeWarning.style.visibility = "visible";
            command = `<span class="highlighted-warning">sudo</span> ${command}`
        } else {
            privilegeWarning.style.visibility = "hidden";
        }

        listenerCommand.innerHTML = command;
    },

    // updateReverseShellSelection: () => {
    //     document.querySelector(".list-group-item.active") ?.classList.remove("active");
    //     const elements = Array.from(document.querySelectorAll(".list-group-item"));
    //     const selectedElement = elements.find((item) => item.innerText === rsg.currentCommandName);
    //     selectedElement?.classList.add("active");
    // },

    // updateReverseShellCommand: () => {
    //     const command = rsg.generateReverseShellCommand();
    //     const commandSelector = rsg.uiElements[rsg.commandType].command;
    //     document.querySelector(commandSelector).innerHTML = command;
    // }
}

/*
    * Init
    */
rsg.init();
rsg.update();

/*
    * Event handlers/functions
    */
ipInput.addEventListener("input", (e) => {
    rsg.setState({
        ip: e.target.value
        })
});

portInput.addEventListener("input", (e) => {
    const value = e.target.value.length === 0 ? '0' : e.target.value;
    rsg.setState({
        port: parsePortOrDefault(value, rsg.getPort())
    })
});

listenerSelect.addEventListener("change", (e) => {
    rsg.setState({
        listener: e.target.value
    })
});

shellSelect.addEventListener("change", (e) => {
    rsg.setState({
        shell: e.target.value
    })
});

encodingSelect.addEventListener("change", (e) => {
    rsg.setState({
        encoding: e.target.value
    })
});

searchBox.addEventListener("input", (e) => {
    rsg.setState({
        filterText: e.target.value
    })
});

document.querySelector('#inc-port').addEventListener('click', () => {
    rsg.setState({
        port: rsg.getPort() + 1
    })
})

document.querySelector('#copy-listener').addEventListener('click', () => {
    rsg.copyToClipboard(listenerCommand.innerText)
})


// document.querySelector('#copy-reverse-shell-command').addEventListener('click', () => {
//     rsg.copyToClipboard(reverseShellCommand.innerText)
// })

// document.querySelector('#copy-bind-shell-command').addEventListener('click', () => {
//     rsg.copyToClipboard(bindShellCommand.innerText)
// })

// document.querySelector('#copy-msfvenom-command').addEventListener('click', () => {
//     rsg.copyToClipboard(msfVenomCommand.innerText)
// })

// document.querySelector('#copy-hoaxshell-command').addEventListener('click', () => {
//     rsg.copyToClipboard(hoaxShellCommand.innerText)
// })


// autoCopySwitch.addEventListener("change", () => {
//     setLocalStorage(autoCopySwitch, "auto-copy", "checked");
// });

// Popper tooltips
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});

// TODO: add a random fifo for netcat mkfifo
//let randomId = Math.random().toString(36).substring(2, 4);

/*Scroll to Top*/
const scrollTopBtn = document.querySelector('.js-scroll-top');
if (scrollTopBtn) {
  scrollTopBtn.onclick = () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
  }
  
  const progressPath = document.querySelector('.scroll-top path');
  const pathLength = progressPath.getTotalLength();
  progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
  progressPath.style.strokeDasharray = `${pathLength} ${pathLength}`;
  progressPath.style.strokeDashoffset = pathLength;
  progressPath.getBoundingClientRect();
  progressPath.style.transition = progressPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';        
  const updateProgress = function() {
    const scroll = window.scrollY || window.scrollTopBtn || document.documentElement.scrollTopBtn;

    const docHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    );

    const windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    const height = docHeight - windowHeight;
    var progress = pathLength - (scroll * pathLength / height);
    progressPath.style.strokeDashoffset = progress;
  }

  updateProgress();
  const offset = 100;

  window.addEventListener('scroll', function(event) {
    updateProgress();

    //Scroll back to top
    const scrollPos = window.scrollY || window.scrollTopBtn || document.getElementsByTagName('html')[0].scrollTopBtn;
    scrollPos > offset ? scrollTopBtn.classList.add('is-active') : scrollTopBtn.classList.remove('is-active');

  }, false);
}