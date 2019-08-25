import Chatkit from '@pusher/chatkit-client';
import axios from 'axios';
import {yuuvisUploadItem} from './components/yuuvis/YuuvisUploadItems';
var request = require('request');
var r = new FileReader();


function toggleFileUploadDialog() {
  this.setState({
    showFileUploadDialog: !this.state.showFileUploadDialog,
  });
}

function uploadAttachment(event) {
  event.preventDefault();
  const { fileMessage, currentUser, currentRoom } = this.state;
  const file = this.fileAttachment.current.files[0];
  // console.log(file);
  r.onload = function(){ console.log(r.result); };
  // console.log(r.readAsBinaryString(file));

  var doc_img="https://i.imgur.com/8iEZZ5d.png";
  var pdf_img="https://i.imgur.com/njzp65F.png";
  var link = '';
  var doc=false;
  var doc_contentType='';
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
  if (doc) {
    yuuvisUploadItem(file.name, file.name, r.readAsBinaryString(file), doc_contentType);
  }
  currentUser
    .sendMessage({
      text: fileMessage || file.name,
      roomId: currentRoom.id,
      attachment: {
        file,
        name: file.name,
      },
    })
    .then(messageId => {
      const roomData = currentRoom.customData || {};

      const roomAttachments = roomData.attachments || {};
      roomAttachments[messageId] = {
        likes: [],
      };

      roomData.attachments = roomAttachments;

      return currentUser.updateRoom({
        roomId: currentRoom.id,
        customData: roomData,
      });
    })
    .catch(console.error);

  this.setState({
    showFileUploadDialog: false,
    fileMessage: '',
  });
}

function sendMessage(event) {
  event.preventDefault();
  const { newMessage, currentUser, currentRoom } = this.state;

  if (newMessage.trim() === '') return;
  // console.log(newMessage)
  currentUser.sendMessage({
    text: newMessage,
    roomId: `${currentRoom.id}`,
  });
  
  this.setState({
    newMessage: '',
  });
}

function handleInput(event) {
  const { value, name } = event.target;

  this.setState({
    [name]: value,
  });
}

function connectToRoom(id = 'aea8771e-d7ba-4951-9717-d023b78e2d0b') {
  const { currentUser } = this.state;

  this.setState({
    messages: [],
  });

  return currentUser
    .subscribeToRoom({
      roomId: `${id}`,
      messageLimit: 100,
      hooks: {
        onMessage: message => {
          translateText.call(this, message);
        },
        onPresenceChanged: () => {
          const { currentRoom } = this.state;
          this.setState({
            roomUsers: currentRoom.users.sort(a => {
              if (a.presence.state === 'online') return -1;

              return 1;
            }),
          });
        },
      },
    })
    .then(currentRoom => {
      const roomName =
        currentRoom.customData && currentRoom.customData.isDirectMessage
          ? currentRoom.customData.userIds.filter(
              id => id !== currentUser.id
            )[0]
          : currentRoom.name;

      this.setState({
        currentRoom,
        roomUsers: currentRoom.users,
        rooms: currentUser.rooms,
        roomName,
      });
    })
    .catch(console.error);
}

function connectToChatkit(event) {
  event.preventDefault();

  const { userId } = this.state;

  if (userId === null || userId.trim() === '') {
    alert('Invalid userId');
    return;
  }

  this.setState({
    isLoading: true,
  });

  axios
    .post('http://localhost:5200/users', { userId })
    .then(() => {
      const tokenProvider = new Chatkit.TokenProvider({
        url: 'http://localhost:5200/authenticate',
      });

      const chatManager = new Chatkit.ChatManager({
        instanceLocator: 'v1:us1:f676ff43-d3d8-4a1e-9c35-48c588a58010',
        userId,
        tokenProvider,
      });

      return chatManager
        .connect({
          onAddedToRoom: room => {
            const { rooms } = this.state;
            this.setState({
              rooms: [...rooms, room],
            });
          },
        })
        .then(currentUser => {
          this.setState(
            {
              currentUser,
              showLogin: false,
              isLoading: false,
              rooms: currentUser.rooms,
            },
            () => connectToRoom.call(this)
          );
        });
    })
    .catch(console.error);
}

function createPrivateRoom(id) {
  const { currentUser, rooms } = this.state;
  const roomName = `${currentUser.id}_${id}`;

  const isPrivateChatCreated = rooms.filter(room => {
    if (room.customData && room.customData.isDirectMessage) {
      const arr = [currentUser.id, id];
      const { userIds } = room.customData;

      if (arr.sort().join('') === userIds.sort().join('')) {
        return {
          room,
        };
      }
    }

    return false;
  });

  if (isPrivateChatCreated.length > 0) {
    return Promise.resolve(isPrivateChatCreated[0]);
  }

  return currentUser.createRoom({
    name: `${roomName}`,
    private: true,
    addUserIds: [`${id}`],
    customData: {
      isDirectMessage: true,
      userIds: [currentUser.id, id],
    },
  });
}

function sendDM(id) {
  createPrivateRoom.call(this, id).then(room => {
    connectToRoom.call(this, room.id);
  });
}

function updateLanguage(event) {
  const { value } = event.target;
  const { messages } = this.state;
  this.setState(
    {
      language: value,
    },
    () => {
      messages.forEach(message => {
        translateText.call(this, message);
      });
    }
  );
}

function translateText(message) {
  const { language, messages } = this.state;
  const { text, id } = message;
  axios
    .post('http://localhost:5200/translate', {
      text,
      lang: language,
    })
    .then(response => {
      const index = messages.findIndex(item => item.id === id);
      const msg = {
        ...message,
        text: response.data.TranslatedText,
      };

      if (index !== -1) {
        messages.splice(index, 1, msg);
      } else {
        messages.push(msg);
      }

      this.setState({
        messages: messages.sort((a, b) => {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }),
      });
    })
    .catch(console.error);
}

export {
  sendMessage,
  handleInput,
  connectToRoom,
  connectToChatkit,
  sendDM,
  toggleFileUploadDialog,
  uploadAttachment,
  updateLanguage,
  translateText
};
