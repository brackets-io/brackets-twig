# Brackets Twig

A Brackets extension to highlight Twig syntax inside HTML files.

[![Build Status](https://travis-ci.org/Athorcis/brackets-twig.svg?branch=master)](https://travis-ci.org/Athorcis/brackets-twig)
[![Dependency Status](https://dependencyci.com/github/Athorcis/brackets-twig/badge)](https://dependencyci.com/github/Athorcis/brackets-twig)

## Install from URL

1. Open the the Extension Manager from the File menu
2. Copy paste the URL of the github repo or zip file


## Install from file system

1. Download this extension using the ZIP button above and unzip it.
2. Copy it in Brackets' `/extensions/user` folder by selecting `Help > Show Extension Folder` in the menu.
3. Reload Brackets.

## FAQ
### Why Twig isn't defined as default language for .twig files ?
It's because the HTML language already define itself as default language for .twig files and there is no way to override this behavior programmatically.

But you can change it quite easily, start by opening one of your twig files in Brackets, then switch the language to Twig and then click on the button which is at the top of the language menu (it says "Set as Default for .TWIG Files")
