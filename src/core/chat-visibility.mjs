// Foundry normally shows a placeholder for whispered dice. A concealed event
// must also conceal the fact that a roll occurred from non-recipients.
export function createChatMessageClass(Base,namespace){
 return class NoShoChatMessage extends Base{
  get visible(){
   const user=globalThis.game?.user;
   if(user?.isGM&&this.getFlag(namespace,'executionRoot'))return false;
   if(this.getFlag(namespace,'concealedRoll')&&this.whisper?.length&&
    !this.isAuthor&&!this.whisper.includes(user?.id))return false;
   return super.visible;
  }
 };
}
