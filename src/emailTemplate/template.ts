export default (title, content) => {

    const style = `
    <style>
        /* -------------------------------------
          GLOBAL RESETS
      ------------------------------------- */

        img {
            border: none;
            -ms-interpolation-mode: bicubic;
            max-width: 100%;
        }

        body {
            background-color: #f6f6f6;
            font-family: sans-serif;
            -webkit-font-smoothing: antialiased;
            font-size: 14px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
        }

        table {
            border-collapse: separate;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            width: 100%;
        }

        table td {
            font-family: sans-serif;
            font-size: 14px;
            vertical-align: top;
        }

        /* -------------------------------------
          BODY & CONTAINER
      ------------------------------------- */

        .body {
            background-color: #f6f6f6;
            width: 100%;
            border-top: 5px solid #00882d
        }

        /* Set a max-width, and make it display as block so it will automatically stretch to that width, but will also shrink down on a phone or something */

        .container {
            display: block;
            Margin: 0 auto !important;
            /* makes it centered */
            max-width: 580px;
            padding: 10px;
            width: 580px;
        }

        /* This should also be a block element, so that it will fill 100% of the .container */

        .content {
            box-sizing: border-box;
            display: block;
            Margin: 0 auto;
            max-width: 580px;
            padding: 10px;
        }

        /* -------------------------------------
          HEADER, FOOTER, MAIN
      ------------------------------------- */

        .main {
            background: #ffffff;
            border-radius: 3px;
            width: 100%;
            text-align: center
        }

        .wrapper {
            box-sizing: border-box;
            padding: 20px;
        }

        .content-block {
            padding-bottom: 10px;
            padding-top: 10px;
        }

        .footer {
            clear: both;
            Margin-top: 10px;
            text-align: center;
            width: 100%;
        }

        .footer td,
        .footer p,
        .footer span,
        .footer a {
            color: #999999;
            font-size: 12px;
            text-align: center;
        }

        .pre-white {
            text-align: center
        }

        /* -------------------------------------
          TYPOGRAPHY
      ------------------------------------- */

        h1,
        h2,
        h3,
        h4 {
            color: #000000;
            font-family: sans-serif;
            font-weight: 400;
            line-height: 1.4;
            margin: 0;
            Margin-bottom: 30px;
        }

        h1 {
            font-size: 35px;
            font-weight: 300;
            text-align: center;
            text-transform: capitalize;
        }

        p,
        ul,
        ol {
            font-family: sans-serif;
            font-size: 14px;
            font-weight: normal;
            margin: 0;
            Margin-bottom: 15px;
        }

        p li,
        ul li,
        ol li {
            list-style-position: inside;
            margin-left: 5px;
        }

        a {
            color: #027c2a;
            text-decoration: underline;
        }

        /* -------------------------------------
          BUTTONS
      ------------------------------------- */

        .btn {
            box-sizing: border-box;
            width: 100%;
        }

        .btn>tbody>tr>td {
            padding-bottom: 15px;
        }

        .btn table {
            width: auto;
        }

        .btn table td {
            background-color: #ffffff;
            border-radius: 5px;
            text-align: center;
        }

        .btn a {
            background-color: #ffffff;
            border: solid 1px #027c2a;
            border-radius: 5px;
            box-sizing: border-box;
            color: #027c2a;
            cursor: pointer;
            display: inline-block;
            font-size: 14px;
            font-weight: bold;
            margin: 0;
            padding: 12px 25px;
            text-decoration: none;
            text-transform: capitalize;
        }

        .btn-primary table td {
            background-color: #027c2a;
        }

        .btn-primary a {
            background-color: #027c2a;
            border-color: #027c2a;
            color: #ffffff;
        }

        /* -------------------------------------
          OTHER STYLES THAT MIGHT BE USEFUL
      ------------------------------------- */

        .last {
            margin-bottom: 0;
        }

        .first {
            margin-top: 0;
        }

        .align-center {
            text-align: center;
        }

        .align-right {
            text-align: right;
        }

        .align-left {
            text-align: left;
        }

        .clear {
            clear: both;
        }

        .mt0 {
            margin-top: 0;
        }

        .mb0 {
            margin-bottom: 0;
        }

        .preheader {
            color: transparent;
            display: none;
            height: 0;
            max-height: 0;
            max-width: 0;
            opacity: 0;
            overflow: hidden;
            mso-hide: all;
            visibility: hidden;
            width: 0;
        }

        .powered-by a {
            text-decoration: none;
        }

        hr {
            border: 0;
            border-bottom: 1px solid #f6f6f6;
            Margin: 20px 0;
        }

        /* -------------------------------------
          RESPONSIVE AND MOBILE FRIENDLY STYLES
      ------------------------------------- */

        @media only screen and (max-width: 620px) {
            table[class=body] h1 {
                font-size: 28px !important;
                margin-bottom: 10px !important;
            }
            table[class=body] p,
            table[class=body] ul,
            table[class=body] ol,
            table[class=body] td,
            table[class=body] span,
            table[class=body] a {
                font-size: 16px !important;
            }
            table[class=body] .wrapper,
            table[class=body] .article {
                padding: 10px !important;
            }
            table[class=body] .content {
                padding: 0 !important;
            }
            table[class=body] .container {
                padding: 0 !important;
                width: 100% !important;
            }
            table[class=body] .main {
                border-left-width: 0 !important;
                border-radius: 0 !important;
                border-right-width: 0 !important;
            }
            table[class=body] .btn table {
                width: 100% !important;
            }
            table[class=body] .btn a {
                width: 100% !important;
            }
            table[class=body] .img-responsive {
                height: auto !important;
                max-width: 100% !important;
                width: auto !important;
            }
        }

        input[type=radio] {
            visibility: hidden;
        }

        form {
            margin: 0 30px;
        }

        label.radio {
            cursor: pointer;
            text-indent: 35px;
            overflow: visible;
            display: inline-block;
            position: relative;
            margin-bottom: 15px;
        }

        label.radio:before {
            background: #00882d;
            content: '';
            position: absolute;
            top: 2px;
            left: 0;
            width: 20px;
            height: 20px;
            border-radius: 100%;
        }

        label.radio:after {
            opacity: 0;
            content: '';
            position: absolute;
            width: 0.5em;
            height: 0.25em;
            background: transparent;
            top: 7.5px;
            left: 4.5px;
            border: 3px solid #ffffff;
            border-top: none;
            border-right: none;

            -webkit-transform: rotate(-45deg);
            -moz-transform: rotate(-45deg);
            -o-transform: rotate(-45deg);
            -ms-transform: rotate(-45deg);
            transform: rotate(-45deg);
        }

        input[type=radio]:checked+label:after {
            opacity: 1;
        }

        hr {
            color: #a9a9a9;
            opacity: 0.3;
        }

        input[type=text],
        input[type=password] {
            width: 100%;
            height: 39px;
            -webkit-border-radius: 0px 4px 4px 0px/5px 5px 4px 4px;
            -moz-border-radius: 0px 4px 4px 0px/0px 0px 4px 4px;
            border-radius: 0px 4px 4px 0px/5px 5px 4px 4px;
            background-color: #fff;
            -webkit-box-shadow: 1px 2px 5px rgba(0, 0, 0, .09);
            -moz-box-shadow: 1px 2px 5px rgba(0, 0, 0, .09);
            box-shadow: 1px 2px 5px rgba(0, 0, 0, .09);
            border: solid 1px #cbc9c9;
            margin-bottom: 30px;
        }

        input {
            margin-bottom: 30px;
            padding-left: 50px;
        }


        #icon {
            display: inline-block;
            width: 30px;
            background-color: #00882d;
            padding: 12px 0px 10px 15px;
            margin-left: 15px;
            -webkit-border-radius: 4px 0px 0px 4px;
            -moz-border-radius: 4px 0px 0px 4px;
            border-radius: 4px 0px 0px 4px;
            color: white;
            -webkit-box-shadow: 1px 2px 5px rgba(0, 0, 0, .09);
            -moz-box-shadow: 1px 2px 5px rgba(0, 0, 0, .09);
            box-shadow: 1px 2px 5px rgba(0, 0, 0, .09);
            border: solid 0px #cbc9c9;
            position: absolute;
            top: 0;
            left: 0;
            margin: 0;
        }

        .gender {
            margin-left: 30px;
            margin-bottom: 30px;
        }

        .accounttype {
            margin-left: 8px;
            margin-top: 20px;
        }

        a.button {
            font-size: 14px;
            font-weight: 600;
            color: white;
            padding: 6px 25px 0px 20px;
            margin: 10px 8px 20px 0px;
            display: inline-block;
            text-decoration: none;
            width: 50px;
            height: 27px;
            -webkit-border-radius: 5px;
            -moz-border-radius: 5px;
            border-radius: 5px;
            background-color: #00882d;
            -webkit-box-shadow: 0 3px rgba(58, 87, 175, .75);
            -moz-box-shadow: 0 3px rgba(58, 87, 175, .75);
            box-shadow: 0 3px rgba(58, 87, 175, .75);
            transition: all 0.1s linear 0s;
            top: 0px;
            position: relative;
        }

        a.button:hover {
            top: 3px;
            background-color: #2e458b;
            -webkit-box-shadow: none;
            -moz-box-shadow: none;
            box-shadow: none;
        }

        .input-div {
            float: left;
            width: 100%;
            position: relative
        }

        /* -------------------------------------
          PRESERVE THESE STYLES IN THE HEAD
      ------------------------------------- */

        @media all {
            .ExternalClass {
                width: 100%;
            }
            .ExternalClass,
            .ExternalClass p,
            .ExternalClass span,
            .ExternalClass font,
            .ExternalClass td,
            .ExternalClass div {
                line-height: 100%;
            }
            .apple-link a {
                color: inherit;
                font-family: inherit !important;
                font-size: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
                text-decoration: none !important;
            }
            .btn-primary table td:hover {
                background-color: #34495e !important;
            }
            .btn-primary a:hover {
                background-color: #34495e !important;
                border-color: #34495e !important;
            }
        }
    </style>`;
    const header = `
<head>
    <meta name="viewport" content="width=device-width" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title id="title">${title}</title>
    <script src="https://use.fontawesome.com/c1891dfbce.js"></script>
    ${style}
</head>
`;
    const footer = `
             <div class="footer">
                        <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <td class="content-block">
                                    <span class="apple-link">
                                        <a href="https://www.gstock.sg" style="color: #333">Gstock Website</a>
                                    </span>
                                    <span class="apple-link">|</span>
                                    <span class="apple-link">
                                        <a href="https://www.gstock.sg" style="color: #333">Terms and Conditions</a>
                                    </span>
                                    <span class="apple-link">|</span>
                                    <span class="apple-link">
                                        <a href="https://www.gstock.sg" style="color: #333">Privacy Policy</a>
                                    </span>

                                </td>
                            </tr>
                            <tr>
                                <td class="content-block">
                                    <span class="apple-link">21 Bukit Batok Crescent #25-81 WCEGA Tower Singapore 658065</span>
                                    <br> Don't like these emails?
                                    <a href="http://i.imgur.com/CScmqnj.gif">Unsubscribe</a>.
                                </td>
                            </tr>
                        </table>
                    </div>
`;

    const body = `
<body class="">
    <table border="0" cellpadding="0" cellspacing="0" class="body">
        <tr>
            <td>&nbsp;</td>
            <td class="container">
            <div class="content">
            <div class="pre-white" style="margin: 30px 0">
                        <img src="http://gstock.sg/media/queldorei/shopper/logo.png" width="40%">
                        <h1>Welcome to Gstock</h1>
                    </div>
            <span class="preheader">Welcome to Gstock</span>
            ${content}
            ${footer}
            </div>
            </td>
            <td>&nbsp;</td>
        </tr>
    </table>
</body>`;
    const html = `
<!doctype html>
<html>
${header}
${body}
</html>
`;
    return html;
};
