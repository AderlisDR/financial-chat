using ChatBot.Core.Models;
using System.Threading.Tasks;

namespace ChatBot.Core.Contracts
{
    public interface IChatHub
    {
        Task SendMessage(ClientMessage message);

        Task DisconnectUser(string userName);
    }
}
