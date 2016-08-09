
define({
    Basic: [
        "[tag {%] [keyword if] [variable a] [tag %}]"
    ],

    HtmlTagWithoutSpace: [
        "[tag&bracket <][tag a{%] [variable b] [tag %}][tag&bracket ></][tag a][tag&bracket >]"
    ]

    // TODO: multiline attribute test
});
