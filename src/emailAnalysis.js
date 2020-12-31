/* email analysis! */
const Imap = require('imap');
require('dotenv').config();
const inspect = require('util').inspect;
const fs = require('fs');

const handleMessage = (msg, seqno) => {
    let prefix = '(#' + seqno + ') ';
    msg.on('body', function(stream, info) {
        let buffer = '';
        stream.on('data', function(chunk) {
            let re = new RegExp(/&zwnj;/, 'gi');
            chunk = chunk.toString('utf8').replace(re, '');
            buffer += chunk;
        });
        stream.once('end', function() {
            // console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
            fs.appendFile('newfile.txt', buffer, function(err) {
                if(err) throw err;
                console.log('saved');
            })
        });
    });
    // msg.once('attributes', function(attrs) {
    //     console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
    // });
    msg.once('end', function() {
        console.log(prefix + 'Finished');
    });
};

const getEmail = (server, address) => {
    const imap = new Imap({
        user: process.env.ADDR,
        password: process.env.PASS,
        host: server,
        port: 993,
        tls: true,
        // debug: (debug) => {
        //     console.log(debug);
        // }
    });

    function openInbox(cb) {
        imap.openBox('trump', true, cb);
    }
    
    imap.once('ready', function() {
        openInbox(function(err, box) {
            if (err) throw err;
            var f = imap.seq.fetch('1:1', {
                bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
                struct: true
            });
            f.on('message', handleMessage);
            f.once('error', function(err) {
                console.log('Fetch error: ' + err);
            });
            f.once('end', function() {
                console.log('Done fetching all messages!');
                imap.end();
            });
        });
    });
    
    imap.once('error', function(err) {
        console.log(err);
    });
    
    imap.once('end', function() {
        console.log('Connection ended');
    });
    
    imap.connect();

};

getEmail(process.env.SERV, process.env.ADDR);

