import { HttpErrorResponse } from '@angular/common/http';
import { EventEmitter, Inject, Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ToastrService } from 'ngx-toastr';
import { ClientMessage } from '../models/client-message.model';
import { ConnectedUser } from '../models/connected-user.model';
import { tokenGetter } from '../shared/functions/token-getter';

@Injectable({
    providedIn: 'root'
})
export class MessengerService {
    private connection: signalR.HubConnection;
    connectedUsers = new EventEmitter<ConnectedUser[]>();
    currentMessages = new EventEmitter<ClientMessage[]>();
    newMessage = new EventEmitter<ClientMessage>();

    constructor(@Inject('BASE_URL') private baseUrl: string, private toastr: ToastrService) {
        this.connection = new signalR.HubConnectionBuilder().withUrl(`${this.baseUrl}hub/chat`, { accessTokenFactory: tokenGetter }).build();
        this.startConnection();
     }

    private startConnection() {
        this.connection.serverTimeoutInMilliseconds = 36000000;
        this.connection.keepAliveIntervalInMilliseconds = 1800000;

        this.connection.start().then(() => {
            this.receiveConnectedUsers();
            this.receiveCurrentMessages();
            this.receiveMessage();
            this.toastr.success("Connected");
        }).catch((error: HttpErrorResponse) => {
            this.toastr.error(error.error, 'Error connecting to chatroom');
        });
    }

    private receiveMessage() {
      this.connection.on("NewMessage", (message: ClientMessage) => {
          this.newMessage.emit(message);
       });
    }

    private receiveConnectedUsers() {
        this.connection.on("ConnectedUsersChanged", (response: ConnectedUser[]) => {
            this.connectedUsers.emit(response);
        });
    }

    private receiveCurrentMessages() {
        this.connection.on("CurrentMessages", (messages: ClientMessage[]) => {
            this.currentMessages.emit(messages)
        });
    }

    closeConnectionForClient(userName: string) {
        this.connection.invoke("DisconnectUser", userName).then(() => {
            console.log(`Usuario ${userName} dejo el chat.`);
        }).catch(() => {
            console.log(`Usuario ${userName} no pudo dejar el chat.`);
        });
    }

    sendNewMessage(message: ClientMessage) {
        return this.connection.invoke("SendMessage", message);
    }

    getConnectedUsers() {
        return this.connectedUsers;
    }
}