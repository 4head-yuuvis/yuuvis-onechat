import React from 'react';
import Proptypes from 'prop-types';
import { format } from 'date-fns';




const ChatSession = props => {
  const { messages } = props;
  return messages.map(message => {
    const time = format(new Date(`${message.updatedAt}`), 'HH:mm');
    var doc_img="https://i.imgur.com/8iEZZ5d.png";
    var pdf_img="https://i.imgur.com/njzp65F.png";
    var link = '';
    var doc=false;
    var doc_contentType='';
    if (message.attachment) {
      var link = message.attachment.link;
      if (link.includes('.pdf')) {
        link = pdf_img;
        doc=true;
        doc_contentType='application/pdf';
      }
      if (link.includes('.doc')) {
        link = doc_img;
        doc=true;
        if (link.includes('.docx')) {
          doc_contentType='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else {
          doc_contentType='application/msword';
        }
        
      }
      var requestSettings = {
        method: 'GET',
        url: message.attachment.link,
        encoding: null,
      };
      // if(doc){
      //   request(requestSettings, function(error, response, body) {
      //     // Use body as a binary Buffer
      //     // console.log(body);
      //     //yuuvisUploadItem(message.attachment.name+'_original', message.attachment.name, body, doc_contentType)
      //   })
        
      // }
    }
    return (
      <li className="message" key={message.id}>
        <div>
          <span className="user-id">{message.senderId}</span>
          <span>
            {message.attachment ? (
                  <div className="media">
                    <div className="media-image">
                      <a href={message.attachment.link}>
                      {doc? (message.attachment.name) : null}
                      </a>
                    </div>
                  </div>
                ) : message.text}
          </span>
        </div>
        <span className="message-time">{time}</span>
      </li>
    );
  });
};

ChatSession.propTypes = {
  messages: Proptypes.arrayOf(Proptypes.object).isRequired,
};

export default ChatSession;
