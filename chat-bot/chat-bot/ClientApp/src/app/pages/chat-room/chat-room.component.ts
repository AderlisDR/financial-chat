import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConnectedUser } from 'src/app/models/connected-user.model';
import { ClientMessage } from '../../models/client-message.model';
import { AuthService } from '../../services/auth.service';
import { MessengerService } from '../../services/messenger.service';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css']
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  connectedClients: ConnectedUser[] = [];
  connectedClientsSubscription: Subscription;
  currentMessages: ClientMessage[] = [];
  currentMessagesSubscription: Subscription;
  newMessageSubscription: Subscription;
  currentUserName: string;
  message = new FormControl('');

  constructor(private messengerService: MessengerService, private authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigateByUrl('/');
    }
    this.currentUserName = this.authService.getCurrentUser().userName;
    this.suscribeToEvents();
  }

  suscribeToEvents() {
    this.connectedClientsSubscription = this.messengerService.connectedUsers.subscribe((connectedUsers: ConnectedUser[]) => {
      if (connectedUsers !== undefined) {
        this.connectedClients = connectedUsers;
      }
    });

    this.currentMessagesSubscription = this.messengerService.currentMessages.subscribe((currentMessages: ClientMessage[]) => {
      if (currentMessages !== undefined) {
        this.currentMessages = currentMessages;
      }
    });

    this.newMessageSubscription = this.messengerService.newMessage.subscribe((newMessage: ClientMessage) => {
      if (newMessage !== undefined) {
        this.currentMessages.push(newMessage);
      }
    });
  }

  send() {
    if (this.message.value.trim() === "") {
      return;
    }

    const newMessage: ClientMessage = {
      clientUserName: this.currentUserName,
      sendedOnUtc: new Date(),
      message: this.message.value
    };

    this.messengerService.sendNewMessage(newMessage).then(() => {
      this.message.setValue("");
    }).catch((error: HttpErrorResponse) => {
      console.log(error);
    });
  }

  ngOnDestroy() {
    this.connectedClientsSubscription.unsubscribe();
    this.currentMessagesSubscription.unsubscribe();
    this.messengerService.closeConnectionForClient(this.currentUserName);
  }
}
