let express = require('express');
let shortid = require('shortid');
let pug = require('pug');
let router = express.Router();
let templatePath = require.resolve('../views/carousel.pug');
let templateFn = pug.compileFile(templatePath);

let apiUrl = process.env.NODE_ENV_SUB === 'prod' ? "https://api.polarishare.com/rest" : "https://api.share.decompany.io/rest";
let imageUrl = process.env.NODE_ENV_SUB === 'prod' ? "https://res.polarishare.com/thumb" : "https://res.share.decompany.io/thumb";
let mainHost = process.env.NODE_ENV_SUB === 'prod' ? "https://www.polarishare.com" : "https://share.decompany.io";
let embedUrl = process.env.NODE_ENV_SUB === 'prod' ? "https://embed.polarishare.com" : "https://embed.share.decompany.io";
let viewerUrl = process.env.NODE_ENV_SUB === 'prod' ? "https://viewer.polarishare.com" : "https://viewer.share.decompany.io";
let getDocumentInfoUrl =  '/api/document/info/';
let staticUrl = process.env.NODE_ENV_SUB === 'prod' ? "https://alpha-ca-static-ssr-embed.s3-us-west-1.amazonaws.com" : "https://dev-ca-static-ssr-embed.s3-us-west-1.amazonaws.com";

router.get('/', (req, res, next) => {


    // 초기화
    const init = () => {
        // 헤더 설정
        res.header("Content-Type", "text/html");
        res.header("X-Robots-Tag", "noindex");

        console.log("\noriginal url : [" + req.originalUrl + "]");

        return Promise.resolve();
    };


    // Document 정보 GET
    const getData = () => {
        return new Promise((resolve, reject) => {
            let XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
            let xhr = new XMLHttpRequest();
            let seoTitle = req.originalUrl.split("/")[1];

            xhr.open('GET', apiUrl + getDocumentInfoUrl + seoTitle, true);

            console.log('\nXMLHttpRequest 시작 . . .');
            console.log("요청 URL : " + apiUrl + getDocumentInfoUrl + seoTitle);

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    if(JSON.parse(xhr.responseText).message) reject();
                    resolve(JSON.parse(xhr.responseText));
                }
            };

            xhr.send(null);
        });
    };


    // GET data 체크
    const checkRes = (data) => {
        console.log('Document Data 유효성 체크 시작 . . .\n');
        if (data.success) {
            console.log('Document Data GET 성공 . . .');
            return Promise.resolve(data);
        } else return Promise.reject(console.log('Document Data GET 실패 . . .'));
    };


    // 이미지 URL SET
    const setImgUrl = (document) => {
        let tmpArr = [];

        console.log('Document 썸네일 이미지 SETTING . . .');
        for (let i = 0; i < document.totalPages; ++i) {
            let url = imageUrl + "/" + document.documentId + "/2048/" + (i + 1);
            tmpArr.push({"image": url});
        }

        return Promise.resolve(tmpArr);
    };


    // 이미지 URL SET
    const setData = async (data) => {

        const document = data.document;
        const text = data.text;
        const imgUrl = await setImgUrl(document);

        return Promise.resolve({
            title: 'carousel',
            urlList: imgUrl,
            seoTitle: document.seoTitle,
            text: text,
            documentId: document.documentId,
            username: document.author.username,
            email: document.author.email,
            docTitle: document.title,
            desc: document.desc || "",
            forceTracking: document.forceTracking,
            useTracking: document.useTracking,
            shortid: shortid.generate(),
            created: new Date(document.created),
            env: process.env.NODE_ENV_SUB,
            mainHost: mainHost,
            embedUrl: embedUrl,
            viewerUrl: viewerUrl,
            apiUrl: apiUrl,
            ogUrl: embedUrl + "/" + document.seoTitle,
            staticUrl: staticUrl
        });
    };


    // 404 페이지 렌더
    const notFoundPageRender = (err) => {
        console.log(err);
        console.log('404 페이지 이동 . . .');
        res.status(404).render('notFoundPage', {title: 'notFoundPage', env: process.env.NODE_ENV_SUB});
    };


    Promise.resolve()
        .then(init)
        .then(getData)
        .then(data => checkRes(data))
        .then(data => setData(data))
        .then(data => {
            res.write(templateFn(data));
            res.end();
        })
        .catch(err => notFoundPageRender(err))
});


module.exports = router;
