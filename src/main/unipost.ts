import { BrowserWindow } from 'electron'
import { decryptPassword } from './crypto'

export interface UniPostRequest {
  id: string
  title: string
  status: string
  submissionDate: string
  requestType?: string
  requestor?: string
  detailUrl?: string
}

let unipostWindow: BrowserWindow | null = null
let isLoggedIn = false
let loginInProgress = false

/**
 * Create a hidden browser window for UniPost operations
 */
function createUniPostWindow(): BrowserWindow {
  if (unipostWindow && !unipostWindow.isDestroyed()) {
    return unipostWindow
  }

  unipostWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false, // Hide window - background processing
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      javascript: true,
      webSecurity: true,
      devTools: false
    }
  })

  // Clean up when window is closed
  unipostWindow.on('closed', () => {
    unipostWindow = null
    isLoggedIn = false
  })

  return unipostWindow
}

/**
 * Login to UniPost with provided credentials
 */
export async function loginToUniPost(
  userId: string,
  encryptedPassword: string
): Promise<{ success: boolean; error?: string; debug?: any }> {
  // If already logged in, return success immediately
  if (isLoggedIn && unipostWindow && !unipostWindow.isDestroyed()) {
    return { success: true }
  }

  // If login is in progress, wait for it to complete
  if (loginInProgress) {
    const maxWaitTime = 20000 // 20 seconds max wait
    const checkInterval = 500 // Check every 500ms
    let waited = 0

    while (loginInProgress && waited < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval))
      waited += checkInterval

      // Check if login completed
      if (isLoggedIn && unipostWindow && !unipostWindow.isDestroyed()) {
        return { success: true }
      }
    }

    // If still in progress after waiting, something went wrong
    if (loginInProgress) {
      // Reset the flag to allow retry
      loginInProgress = false
    }
  }

  if (!userId || !encryptedPassword) {
    return { success: false, error: 'Missing credentials' }
  }

  loginInProgress = true

  try {
    const password = decryptPassword(encryptedPassword)
    if (!password) {
      return { success: false, error: 'Failed to decrypt password' }
    }

    const window = createUniPostWindow()

    // Navigate to login page
    console.log('Navigating to UniPost login page...')
    await window.loadURL('https://114.unipost.co.kr/welcome.uni')

    // Wait for page to load completely
    console.log('Waiting for login form to appear...')

    // Poll for login form to appear (max 15 seconds)
    let loginFormFound = false
    let attempts = 0
    const maxAttempts = 15

    while (!loginFormFound && attempts < maxAttempts) {
      attempts++
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const formCheck = await window.webContents.executeJavaScript(`
        (function() {
          const allInputs = Array.from(document.querySelectorAll('input'));
          const visibleInputs = allInputs.filter(i => i.offsetParent !== null);

          const hasUserId = visibleInputs.some(i =>
            i.type === 'text' ||
            i.name === 'userId' ||
            i.id === 'userId'
          );

          const hasPassword = visibleInputs.some(i =>
            i.type === 'password' &&
            (i.name === 'password' || i.id === 'password')
          );

          return {
            found: hasUserId && hasPassword,
            visibleInputCount: visibleInputs.length,
            hasUserId: hasUserId,
            hasPassword: hasPassword
          };
        })();
      `)

      console.log(`Attempt ${attempts}: Login form found=${formCheck.found}, visible inputs=${formCheck.visibleInputCount}`)

      if (formCheck.found) {
        loginFormFound = true
        console.log('Login form detected!')
      }
    }

    if (!loginFormFound) {
      console.log('Login form did not appear after', maxAttempts, 'seconds')
    }

    // Wait a bit more for form to stabilize
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Collect page information for debugging
    const pageDebug = await window.webContents.executeJavaScript(`
      (function() {
        const allInputs = Array.from(document.querySelectorAll('input'));
        const allButtons = Array.from(document.querySelectorAll('button, input[type="submit"], a'));

        return {
          url: window.location.href,
          title: document.title,
          bodyHTML: document.body?.innerHTML?.substring(0, 1000),
          inputCount: allInputs.length,
          inputs: allInputs.map(i => ({
            tag: i.tagName,
            type: i.type,
            name: i.name,
            id: i.id,
            className: i.className,
            placeholder: i.placeholder,
            visible: i.offsetParent !== null
          })),
          buttons: allButtons.map(b => ({
            tag: b.tagName,
            type: b.type,
            text: b.textContent?.trim().substring(0, 50),
            className: b.className,
            visible: b.offsetParent !== null
          }))
        };
      })();
    `)

    console.log('=== PAGE DEBUG INFO ===')
    console.log('URL:', pageDebug.url)
    console.log('Title:', pageDebug.title)
    console.log('Input count:', pageDebug.inputCount)
    console.log('Inputs:', JSON.stringify(pageDebug.inputs, null, 2))
    console.log('Buttons:', JSON.stringify(pageDebug.buttons, null, 2))
    console.log('=====================')

    // Execute login script with improved logic
    const loginResult = await window.webContents.executeJavaScript(`
      (function() {
        try {
          // Find all input fields (including hidden ones)
          const allInputs = Array.from(document.querySelectorAll('input'));
          console.log('Total inputs found:', allInputs.length);

          // Find visible text inputs
          const visibleInputs = allInputs.filter(input => input.offsetParent !== null);
          console.log('Visible inputs:', visibleInputs.length);

          const textInputs = visibleInputs.filter(input =>
            input.type === 'text' ||
            input.type === '' ||
            !input.type ||
            input.name?.toLowerCase().includes('id') ||
            input.name?.toLowerCase().includes('user')
          );

          const passwordInputs = visibleInputs.filter(input =>
            input.type === 'password'
          );

          console.log('Text inputs found:', textInputs.length);
          console.log('Password inputs found:', passwordInputs.length);

          if (textInputs.length === 0 || passwordInputs.length === 0) {
            // Try finding inputs in a different way - by index
            const firstTwoVisibleInputs = visibleInputs.slice(0, 2);
            if (firstTwoVisibleInputs.length >= 2) {
              console.log('Using first two visible inputs as fallback');
              const userIdInput = firstTwoVisibleInputs[0];
              const passwordInput = firstTwoVisibleInputs[1];

              userIdInput.value = '${userId.replace(/'/g, "\\'")}';
              passwordInput.value = '${password.replace(/'/g, "\\'")}';

              [userIdInput, passwordInput].forEach(input => {
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('blur', { bubbles: true }));
              });

              // Find and click any button
              const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'))
                .filter(b => b.offsetParent !== null);

              if (buttons.length > 0) {
                setTimeout(() => buttons[0].click(), 200);
                return { success: true, method: 'fallback_first_button' };
              }

              return { success: false, error: 'No visible buttons found' };
            }

            return {
              success: false,
              error: 'Login form not found',
              debug: {
                totalInputs: allInputs.length,
                visibleInputs: visibleInputs.length,
                textInputs: textInputs.length,
                passwordInputs: passwordInputs.length,
                allInputTypes: allInputs.map(i => ({ type: i.type, name: i.name, visible: i.offsetParent !== null }))
              }
            };
          }

          const userIdInput = textInputs[0];
          const passwordInput = passwordInputs[0];

          console.log('Found userId input:', userIdInput.name || userIdInput.id);
          console.log('Found password input:', passwordInput.name || passwordInput.id);

          // Fill in credentials
          userIdInput.value = '${userId.replace(/'/g, "\\'")}';
          passwordInput.value = '${password.replace(/'/g, "\\'")}';

          // Dispatch multiple events
          [userIdInput, passwordInput].forEach(input => {
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('keyup', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
          });

          // Find login button
          const allButtons = Array.from(document.querySelectorAll('button, input[type="submit"], a'));
          const visibleButtons = allButtons.filter(b => b.offsetParent !== null);

          let loginButton = visibleButtons.find(btn => {
            const text = btn.textContent?.trim() || btn.value || '';
            return text.includes('로그인') || text.includes('Login') || text.toLowerCase().includes('login');
          });

          if (!loginButton) {
            const form = passwordInput.closest('form');
            if (form) {
              loginButton = form.querySelector('button[type="submit"]') ||
                           form.querySelector('input[type="submit"]') ||
                           form.querySelector('button');
            }
          }

          if (!loginButton && visibleButtons.length > 0) {
            loginButton = visibleButtons[0];
          }

          if (loginButton) {
            console.log('Found login button, clicking...');
            setTimeout(() => loginButton.click(), 200);
            return { success: true, method: 'button_click' };
          }

          // Try form submit as last resort
          const form = userIdInput.closest('form');
          if (form) {
            console.log('No button found, submitting form...');
            setTimeout(() => form.submit(), 200);
            return { success: true, method: 'form_submit' };
          }

          return { success: false, error: 'Login button not found' };
        } catch (error) {
          console.error('Login script error:', error);
          return { success: false, error: error.message, stack: error.stack };
        }
      })();
    `)

    console.log('Login execution result:', loginResult)

    if (!loginResult.success) {
      console.error('Login execution failed:', loginResult)
      return {
        success: false,
        error: loginResult.error || 'Login failed',
        debug: loginResult.debug
      }
    }

    console.log('Waiting for navigation after login...')
    // Wait for navigation after login
    await new Promise((resolve) => setTimeout(resolve, 5000))

    // Check if login was successful by checking URL or page content
    const currentUrl = window.webContents.getURL()
    console.log('Current URL after login:', currentUrl)

    // Check for error messages first
    const pageCheck = await window.webContents.executeJavaScript(`
      (function() {
        const errorEl = document.querySelector('.error-message, .alert-danger, .login-error, .error, .alert');
        const errorText = errorEl ? errorEl.textContent?.trim() : null;

        return {
          url: window.location.href,
          hasError: !!errorEl,
          errorText: errorText,
          title: document.title,
          bodyText: document.body?.textContent?.substring(0, 200)
        };
      })();
    `)

    console.log('Page check after login:', pageCheck)

    // Check if we're still on login page or if there's an error
    const isStillOnLoginPage = currentUrl.includes('welcome.uni')
    const hasError = pageCheck.hasError

    if (hasError) {
      return {
        success: false,
        error: pageCheck.errorText || 'Login failed - error message found on page'
      }
    }

    if (!isStillOnLoginPage || currentUrl.includes('main') || currentUrl.includes('home') || currentUrl.includes('index')) {
      isLoggedIn = true
      console.log('Login successful!')
      return { success: true }
    } else {
      return {
        success: false,
        error: 'Still on login page - credentials may be incorrect or login form structure changed',
        debug: pageCheck
      }
    }
  } catch (error: any) {
    console.error('UniPost login error:', error)
    return { success: false, error: error.message || 'Unknown error occurred' }
  } finally {
    loginInProgress = false
  }
}

/**
 * Fetch request history from UniPost
 */
export async function fetchRequestHistory(userName: string, supportPartType?: string): Promise<UniPostRequest[]> {
  if (!isLoggedIn || !unipostWindow || unipostWindow.isDestroyed()) {
    throw new Error('Not logged in to UniPost')
  }

  try {
    console.log(`Fetching request history for user: ${userName}`)

    // Navigate to home page
    const currentUrl = unipostWindow.webContents.getURL()
    if (!currentUrl.includes('home.uni')) {
      console.log('Navigating to home.uni...')
      await unipostWindow.loadURL('https://114.unipost.co.kr/home.uni')
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }

    // Click on request history menu
    const clickResult = await unipostWindow.webContents.executeJavaScript(`
      (function() {
        const allElements = Array.from(document.querySelectorAll('li, a, button, div[role="tab"]'));
        const targetElement = allElements.find(el => {
          const text = el.textContent?.trim() || '';
          const title = el.getAttribute('title') || '';
          const name = el.getAttribute('name') || '';
          return title.includes('요청내역관리') || name.includes('요청내역관리') || text === '요청내역관리';
        });

        if (targetElement) {
          targetElement.click();
          return { success: true };
        }
        return { success: false, error: 'Menu item not found' };
      })();
    `)

    if (!clickResult.success) {
      throw new Error("Failed to find request history menu");
    }

    console.log("Clicked request history menu");

    // Wait for iframe to load
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Set search conditions and trigger search
    const searchResult = await unipostWindow.webContents.executeJavaScript(`
      (function() {
        try {
          // Get current date for END_DATE and 1 year ago for START_DATE
          const today = new Date();
          const endDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

          const sixMonthsAgo = new Date(today);
          sixMonthsAgo.setMonth(today.getMonth() - 6); // 🔹 6개월 전
          const startDate = sixMonthsAgo.toISOString().split('T')[0];

          console.log('Search dates:', startDate, 'to', endDate);

          // Find the iframe with request history
          const li = document.querySelector('li[title="요청내역관리"], li[name="요청내역관리"]');
          if (!li) {
            return { success: false, error: '요청내역관리 메뉴를 찾을 수 없습니다' };
          }

          const tabId = li.getAttribute('aria-controls');
          if (!tabId) {
            return { success: false, error: 'Tab ID를 찾을 수 없습니다' };
          }

          const iframe = document.getElementById(tabId);
          if (!iframe || !iframe.contentWindow) {
            return { success: false, error: 'iframe을 찾을 수 없습니다' };
          }

          const win = iframe.contentWindow;

          // Check if UNIUX.SVC is available
          if (!win.UNIUX || typeof win.UNIUX.SVC !== 'function') {
            return { success: false, error: 'UNIUX.SVC를 사용할 수 없습니다' };
          }

          // Set search conditions using UNIUX.SVC
          win.UNIUX.SVC('PROGRESSION_TYPE', 'R,E,O,A,C,N,M');
          win.UNIUX.SVC('START_DATE', startDate);
          win.UNIUX.SVC('END_DATE', endDate);
          win.UNIUX.SVC('RECEIPT_INFO_SEARCH_TYPE', 'P'); // 처리자
          win.UNIUX.SVC('RECEIPT_INFO_TEXT', '${userName.replace(/'/g, "\\'")}');
          win.UNIUX.SVC('UNIDOCU_PART_TYPE', '${(supportPartType || "").replace(/[^0-9N]/g, "")}');

          console.log('Search conditions set');

          // Check the "처리자" checkbox if available
          const processorCheckbox = iframe.contentDocument.querySelector('input[name="RECEIPT_INFO_PROCESS"]');
          if (processorCheckbox) {
            processorCheckbox.checked = true;
            processorCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Processor checkbox checked');
          }

          // Debug: List all available functions in iframe window
          const availableFunctions = Object.keys(win).filter(key => typeof win[key] === 'function' && key.toLowerCase().includes('search'));
          console.log('Available search functions:', availableFunctions);

          // Try to find and trigger search function directly
          let searchTriggered = false;

          // Method 1: Try calling search function directly
          const searchFunctionNames = ['fn_search', 'fn_Search', 'doSearch', 'onSearch', 'search', 'fnSearch', 'Search'];

          for (const funcName of searchFunctionNames) {
            if (win[funcName] && typeof win[funcName] === 'function') {
              console.log(\`Calling \${funcName}()...\`);
              try {
                win[funcName]();
                searchTriggered = true;
                break;
              } catch (e) {
                console.log(\`Error calling \${funcName}:\`, e.message);
              }
            }
          }

          // Method 2: If no function found, find and click search button
          if (!searchTriggered) {
            const allButtons = Array.from(iframe.contentDocument.querySelectorAll('button, input[type="button"], a'));

            // Debug: Log all buttons
            console.log('All buttons in iframe:', allButtons.map(btn => ({
              tag: btn.tagName,
              text: btn.textContent?.trim(),
              title: btn.getAttribute('title'),
              id: btn.id,
              className: btn.className,
              onclick: btn.getAttribute('onclick')
            })));

            // Try to find button with specific text
            let searchButton = allButtons.find(btn => {
              const text = btn.textContent?.trim() || btn.value || '';
              const title = btn.getAttribute('title') || '';
              return text === '조회' || title === '조회' ||
                     text === '검색' || title === '검색' ||
                     text.includes('Search') || title.includes('Search');
            });

            // If not found, try by ID
            if (!searchButton) {
              searchButton = iframe.contentDocument.querySelector('#btn_search') ||
                           iframe.contentDocument.querySelector('#btnSearch') ||
                           iframe.contentDocument.querySelector('[id*="search"]') ||
                           iframe.contentDocument.querySelector('[id*="Search"]');
            }

            if (searchButton) {
              console.log('Found search button:', {
                text: searchButton.textContent?.trim(),
                id: searchButton.id,
                className: searchButton.className,
                onclick: searchButton.getAttribute('onclick')
              });

              // Try to call onclick handler if it exists
              const onclickAttr = searchButton.getAttribute('onclick');
              if (onclickAttr) {
                console.log('Executing onclick handler...');
                try {
                  // Execute the onclick code
                  eval(onclickAttr);
                  searchTriggered = true;
                } catch (e) {
                  console.log('onclick eval error:', e.message);
                }
              }

              // Also dispatch events
              if (!searchTriggered) {
                console.log('Clicking button with events...');
                searchButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                searchButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                searchButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                searchButton.click();
                searchTriggered = true;
              }
            }
          }

          if (searchTriggered) {
            return { success: true, searchTriggered: true };
          } else {
            console.log('No search method found, will try to read existing grid data...');
            return { success: true, searchTriggered: false };
          }
        } catch (error) {
          console.error('Search setup error:', error);
          return { success: false, error: error.message, stack: error.stack };
        }
      })();
    `);

    console.log('Search result:', searchResult)

    if (!searchResult.success) {
      throw new Error(searchResult.error || 'Failed to setup search')
    }

    // Wait for search to complete - increased timeout for search to finish
    console.log('Waiting for search to complete...')
    await new Promise((resolve) => setTimeout(resolve, 4000))

    // Extract grid data
    const requests = await unipostWindow.webContents.executeJavaScript(`
      (function() {
        try {
          console.log('Extracting grid data...');

          // Find the iframe with request history
          const li = document.querySelector('li[title="요청내역관리"], li[name="요청내역관리"]');
          if (!li) {
            return { success: false, error: '요청내역관리 메뉴를 찾을 수 없습니다' };
          }

          const tabId = li.getAttribute('aria-controls');
          const iframe = document.getElementById(tabId);
          if (!iframe || !iframe.contentWindow) {
            return { success: false, error: 'iframe을 찾을 수 없습니다' };
          }

          const win = iframe.contentWindow;

          // Check if grid is available
          if (!win.grid || typeof win.grid.getAllRowValue !== 'function') {
            console.error('Grid not found or getAllRowValue not available');
            return { success: false, error: 'Grid를 찾을 수 없습니다' };
          }

          const gridData = win.grid.getAllRowValue();
          console.log('Grid data row count:', gridData.length);

          // Generate detail URLs and map to our interface
          const data = gridData.map(row => ({
            id: row.SR_IDX || '',
            title: row.REQ_TITLE || 'Untitled',
            status: row.STATUS || 'Unknown',
            submissionDate: row.REQ_DATE || row.PROC_DATE || '',
            requestType: row.PT_NAME || '',
            requestor: row.REQ_NAME || '',
            handler: row.WRITER || '',
            detailUrl: row.SR_IDX ? \`https://114.unipost.co.kr/receipt/detail?srIdx=\${row.SR_IDX}\` : ''
          }));

          return {
            success: true,
            totalRows: gridData.length,
            data: data
          };
        } catch (error) {
          console.error('Grid extraction error:', error);
          return { success: false, error: error.message, stack: error.stack };
        }
      })();
    `)

    console.log('Grid extraction result:', {
      success: requests.success,
      totalRows: requests.totalRows,
      dataLength: requests.data?.length || 0
    })

    if (!requests.success) {
      throw new Error(requests.error || 'Failed to fetch requests')
    }

    return requests.data || []
  } catch (error: any) {
    console.error('Fetch request history error:', error)
    throw error
  }
}

/**
 * Logout from UniPost
 */
export async function logoutFromUniPost(): Promise<void> {
  if (unipostWindow && !unipostWindow.isDestroyed()) {
    unipostWindow.close()
  }
  unipostWindow = null
  isLoggedIn = false
  loginInProgress = false // Reset login progress flag
}

/**
 * Check if currently logged in
 */
export function isUniPostLoggedIn(): boolean {
  return isLoggedIn && unipostWindow !== null && !unipostWindow.isDestroyed()
}

/**
 * Show or hide the UniPost window (for debugging)
 */
export function toggleUniPostWindow(show: boolean): void {
  if (unipostWindow && !unipostWindow.isDestroyed()) {
    if (show) {
      unipostWindow.show()
    } else {
      unipostWindow.hide()
    }
  }
}
