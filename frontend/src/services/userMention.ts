import { supabase } from './supabase';

export interface UserMention {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

export class UserMentionService {
  /**
   * Search users for mention autocomplete
   */
  static async searchUsers(query: string): Promise<UserMention[]> {
    if (!query.trim()) return [];

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in user search:', error);
      return [];
    }
  }
}

// TipTap mention suggestion configuration
export const userMentionSuggestion = {
  items: async ({ query }: { query: string }) => {
    return UserMentionService.searchUsers(query);
  },

  render: () => {
    let component: any;
    let popup: any;

    return {
      onStart: (props: any) => {
        component = new MentionList(props);
        popup = document.createElement('div');
        popup.className = 'z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto';
        document.body.appendChild(popup);
        component.updateProps(props);
      },

      onUpdate(props: any) {
        component.updateProps(props);
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup.remove();
          return true;
        }
        return component.onKeyDown(props);
      },

      onExit() {
        popup.remove();
        component.destroy();
      }
    };
  }
};

class MentionList {
  items: UserMention[] = [];
  selectedIndex = 0;

  constructor(props: any) {
    this.updateProps(props);
  }

  updateProps(props: any) {
    this.items = props.items;
    this.selectedIndex = 0;
    this.render();
  }

  onKeyDown({ event }: { event: KeyboardEvent }) {
    if (event.key === 'ArrowUp') {
      this.upHandler();
      return true;
    }

    if (event.key === 'ArrowDown') {
      this.downHandler();
      return true;
    }

    if (event.key === 'Enter') {
      this.enterHandler();
      return true;
    }

    return false;
  }

  upHandler() {
    this.selectedIndex = ((this.selectedIndex + this.items.length) - 1) % this.items.length;
    this.render();
  }

  downHandler() {
    this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    this.render();
  }

  enterHandler() {
    this.selectItem(this.selectedIndex);
  }

  selectItem(index: number) {
    const item = this.items[index];
    if (item) {
      // This would be called by TipTap's command
    }
  }

  render() {
    // Basic rendering - in a real app, you'd use React components
    const popup = document.querySelector('.mention-popup');
    if (popup) {
      popup.innerHTML = this.items.map((item, index) => 
        `<div class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
          index === this.selectedIndex ? 'bg-blue-100 dark:bg-blue-900' : ''
        }">
          <div class="flex items-center space-x-2">
            <img src="${item.avatar_url || ''}" class="w-6 h-6 rounded-full" />
            <div>
              <div class="font-medium">${item.display_name}</div>
              <div class="text-sm text-gray-500">@${item.username}</div>
            </div>
          </div>
        </div>`
      ).join('');
    }
  }

  destroy() {
    // Cleanup
  }
}