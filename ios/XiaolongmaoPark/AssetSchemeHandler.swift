import Foundation
import WebKit

/// 把 appassets://localhost/www/xxx 映射成 App 包内的 www/xxx 文件。
/// 同步返回数据（本地文件读取足够快），避免 WKURLSchemeTask 被取消后再回调导致崩溃。
final class AssetSchemeHandler: NSObject, WKURLSchemeHandler {

    private let bundleRoot: URL

    override init() {
        bundleRoot = Bundle.main.bundleURL
        super.init()
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(NSError(domain: NSURLErrorDomain, code: NSURLErrorBadURL))
            return
        }

        let fileURL = resolve(url)
        guard let data = try? Data(contentsOf: fileURL) else {
            urlSchemeTask.didFailWithError(NSError(domain: NSURLErrorDomain, code: NSURLErrorFileDoesNotExist))
            return
        }

        var statusCode = 200
        var body = data
        var headers: [String: String] = [
            "Content-Type": mimeType(for: fileURL.pathExtension),
            "Cache-Control": "no-cache",
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*"
        ]

        // 音频播放器会带 Range 头来请求片段，这里做最小可用的 206 响应
        if let rangeHeader = urlSchemeTask.request.value(forHTTPHeaderField: "Range"),
           let range = parseRange(rangeHeader, total: data.count) {
            body = data.subdata(in: range)
            statusCode = 206
            headers["Content-Range"] = "bytes \(range.lowerBound)-\(range.upperBound - 1)/\(data.count)"
        }
        headers["Content-Length"] = String(body.count)

        guard let response = HTTPURLResponse(url: url,
                                             statusCode: statusCode,
                                             httpVersion: "HTTP/1.1",
                                             headerFields: headers) else {
            urlSchemeTask.didFailWithError(NSError(domain: NSURLErrorDomain, code: NSURLErrorUnknown))
            return
        }

        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(body)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        // 同步完成，无需中断
    }

    /// appassets://localhost/www/a/b.css -> <App.app>/www/a/b.css
    private func resolve(_ url: URL) -> URL {
        var path = url.path
        if path.isEmpty || path == "/" { path = "/www/index.html" }
        if path.hasSuffix("/") { path += "index.html" }

        let decoded = path.removingPercentEncoding ?? path
        let segments = decoded.split(separator: "/").filter { $0 != "." && $0 != ".." }
        var relative = segments.joined(separator: "/")
        if relative.isEmpty { relative = "www/index.html" }
        return bundleRoot.appendingPathComponent(relative)
    }

    private func parseRange(_ header: String, total: Int) -> Range<Int>? {
        guard total > 0, header.lowercased().hasPrefix("bytes=") else { return nil }
        let spec = String(header.dropFirst("bytes=".count))
        let parts = spec.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 2 else { return nil }

        let startText = String(parts[0]).trimmingCharacters(in: .whitespaces)
        let endText = String(parts[1]).trimmingCharacters(in: .whitespaces)
        guard let start = Int(startText), start >= 0, start < total else { return nil }

        var end = total - 1
        if !endText.isEmpty {
            guard let parsed = Int(endText) else { return nil }
            end = min(parsed, total - 1)
        }
        guard end >= start else { return nil }
        return start..<(end + 1)
    }

    private func mimeType(for ext: String) -> String {
        switch ext.lowercased() {
        case "html", "htm": return "text/html; charset=utf-8"
        case "js": return "application/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json": return "application/json; charset=utf-8"
        case "webmanifest": return "application/manifest+json; charset=utf-8"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "webp": return "image/webp"
        case "gif": return "image/gif"
        case "woff2": return "font/woff2"
        case "woff": return "font/woff"
        case "ttf": return "font/ttf"
        case "mp3": return "audio/mpeg"
        case "wav": return "audio/wav"
        case "m4a": return "audio/mp4"
        case "txt": return "text/plain; charset=utf-8"
        default: return "application/octet-stream"
        }
    }
}
