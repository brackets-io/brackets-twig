#!/bin/sh

output=athorcis.brackets-twig.zip

rm $output
npm test && git archive --format zip -o $output master
