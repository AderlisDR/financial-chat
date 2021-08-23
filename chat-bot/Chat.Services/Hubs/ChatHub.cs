using ChatBot.Core.Contracts;
using ChatBot.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Chat.Services.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ISender _sender;
        private static IList<ConnectedUser> _connectedUsers = new List<ConnectedUser>();
        private static IList<ClientMessage> _currentMessages = new List<ClientMessage>();

        public ChatHub(ISender sender)
        {
            _sender = sender;
        }

        private void AddToCurrentMessages(ClientMessage message)
        {
            _currentMessages.Add(message);

            if (_currentMessages.Count() > 50)
                _currentMessages.RemoveAt(0);
        }

        public override Task OnConnectedAsync()
        {
            string userName = Context.User.Identity.Name;
            string connectionId = Context.ConnectionId;

            if (!_connectedUsers.Any(connectedUser => connectedUser.UserName == userName))
            {
                _connectedUsers.Add(new ConnectedUser { ConnectionId = connectionId, UserName = userName });
                Clients.All.SendAsync("ConnectedUsersChanged", _connectedUsers);
            }
            else
            {
                Clients.Caller.SendAsync("ConnectedUsersChanged", _connectedUsers);
            }

            Clients.Caller.SendAsync("CurrentMessages", _currentMessages);

            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            return base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(ClientMessage message)
        {
            await Clients.All.SendAsync("NewMessage", message);
            AddToCurrentMessages(message);

            if (message.Message.Contains("/stock="))
            {
                _sender.SendMessage(message);
            }
        }

        public void SaveBotMessage(ClientMessage message)
        {
            AddToCurrentMessages(message);
        }

        public async Task DisconnectUser(string userName)
        {
            if (_connectedUsers.Any(currentUser => currentUser.UserName == userName))
            {
                _connectedUsers = _connectedUsers.Where(currentUser => currentUser.UserName != userName).ToList();
                await Clients.All.SendAsync("ConnectedUsersChanged", _connectedUsers);
            }
        }
    }
}
