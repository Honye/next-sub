Maybe this isn't for you.

Subscription Converter

| Type | [Clash](https://clash.wiki/) | [sing-box](https://sing-box.sagernet.org/clients/apple/) |
| :--- | :---- | :---- |
| VMESS | ✓ | ✓ |
| SS | ✓ | ✓ |
| SSR | ✓ | ✗ (sing-box not support) |

Tested:

- [Just My Socks](https://justmysocks.net/members/aff.php?aff=31408)
- [XLinkWorld](https://www.xlinkworld.cc)

Usage:

One way is use `{host}/sub?url={encoded_subscription_link}`

Another way is use local server, add environment variable `SUBSCRIPTION_URL`, then `{hose}/sub`

sing-box: `{host}/sub?url={encoded_subscription_link}&target=sing`

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhonye%2Fnext-sub)

macOS [sing-box](https://sing-box.sagernet.org/clients/apple/) config files stored in `~/Library/Group Containers/group.io.nekohasekai.sfa/configs/`, log files stored in `~/Library/Group Containers/group.io.nekohasekai.sfa/Library/Caches/Working/`
