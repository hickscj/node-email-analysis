/* email analysis! */
const Imap = require('imap');
const dotenv = require('dotenv').config();
const inspect = require('util').inspect;

const handleMessage = (msg, seqno) => {
    let prefix = '(#' + seqno + ') ';
    msg.on('body', function(stream, info) {
        let buffer = '';
        stream.on('data', function(chunk) {
            buffer += chunk.toString('utf8');
        });
        stream.once('end', function() {
            console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
        });
    });
    msg.once('attributes', function(attrs) {
        console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
    });
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
            var f = imap.seq.fetch('1:3', {
                bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
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
