#!/bin/sh

output=dist/athorcis.brackets-twig.zip
dir=$(dirname "$output")

if [ ! -d "$dir" ]
then
    mkdir -p "$dir"
fi

if [ -f "$output" ]
then
    rm "$output"
fi

git archive --format zip -o "$output" --worktree-attributes master
