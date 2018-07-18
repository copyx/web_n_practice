let http = require('http');
let url = require('url');
let fs = require('fs');
let qs = require('querystring');
let template = require('./lib/template.js');
let path = require('path');
let sanitizeHtml = require('sanitize-html');

let app = http.createServer(function (request, response) {
    let _url = request.url;
    let queryData = url.parse(_url, true).query;
    let pathname = url.parse(_url, true).pathname;
    let title = queryData.id;

    if (pathname === '/') {
        if (queryData.id === undefined) {
            fs.readdir('./data', function (err, files) {
                let title = 'Welcome';
                let description = 'Hello, Node.js';
                let list = template.list(files);
                let html = template.HTML(title, list,
                    `<h2>${title}</h2>${description}`,
                    '<a href="/create">create</a>');
                response.writeHead(200);
                response.end(html);
            });
        } else {
            fs.readdir('./data', function (err, files) {
                let filteredId = path.parse(queryData.id).base;
                fs.readFile(`./data/${filteredId}`, 'utf8', function (err, description) {
                    let sanitizedTitle = sanitizeHtml(title);
                    let sanitizeDescription = sanitizeHtml(description, {
                        allowedTags: ['h1']
                    });
                    let list = template.list(files);
                    let html = template.HTML(title, list,
                        `<h2>${sanitizedTitle}</h2>${sanitizeDescription}`,
                        `
                        <a href="/create">create</a>
                        <a href="/update?id=${title}">update</a>
                        <form action="delete_process" method="post">
                            <input type="hidden" name="id" value="${sanitizedTitle}">
                            <input type="submit" value="delete">
                        </form>
                        `);
                    response.writeHead(200);
                    response.end(html);
                });
            });
        }
    } else if (pathname === '/create') {
        if (queryData.id === undefined) {
            fs.readdir('./data', function (err, files) {
                let title = 'WEB - create';
                let list = template.list(files);
                let html = template.HTML(title, list, `
                    <form action="/create_process" method="post">
                        <p><input type="text" name="title" placeholder="title"></p>
                        <p>
                            <textarea name="description" placeholder="description"></textarea>
                        </p>
                        <p>
                            <input type="submit">
                        </p>
                    </form>
                `, '');
                response.writeHead(200);
                response.end(html);
            });
        }
    } else if (pathname === '/create_process') {
        let body = '';

        request.on('data', function (data) {
            body += data;
        });
        request.on('end', function () {
            let post = qs.parse(body);
            let title = post.title;
            let description = post.description;

            fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
                console.log(err);
                response.writeHead(302, {Location: `/?id=${title}`});
                response.end();
            });
        });
    } else if (pathname === '/update') {
        fs.readdir('./data', function (err, files) {
            let filteredId = path.parse(queryData.id).base;
            fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
                let title = queryData.id;
                let list = template.list(files);
                let html = template.HTML(title, list,
                    `<form action="/update_process" method="post">
                        <input type="hidden" name="id" value="${title}">
                        <p><input type="text" name="title" placeholder="title" value="${title}"></p>
                        <p>
                            <textarea name="description" placeholder="description">${description}</textarea>
                        </p>
                        <p>
                            <input type="submit">
                        </p>
                    </form>
                `, '<a href="/create">create</a> <a href="/update?id=${title}">update</a>');
                response.writeHead(200);
                response.end(html);
            });
        });
    } else if (pathname === '/update_process') {
        let body = '';

        request.on('data', function (data) {
            body += data;
        });
        request.on('end', function () {
            let post = qs.parse(body);
            let id = post.id;
            let filteredId = path.parse(id).base;
            let title = post.title;
            let description = post.description;

            fs.rename(`data/${filteredId}`, `data/${title}`, function (err) {
                console.log(err);
                fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
                    console.log(err);
                    response.writeHead(302, {Location: `/?id=${title}`});
                    response.end();
                });
            });
        });
    } else if (pathname === '/delete_process') {
        let body = '';
        request.on('data', function (data) {
            body += data;
        });
        request.on('end', function () {
            let post = qs.parse(body);
            let id = post.id;
            let filteredId = path.parse(id).base;
            fs.unlink(`data/${filteredId}`, function (err) {
                console.log(err);
                response.writeHead(302, {Location: '/'});
                response.end();
            });
        })
    } else {
        response.writeHead(404);
        response.end('Not found');
    }

});
app.listen(3000);