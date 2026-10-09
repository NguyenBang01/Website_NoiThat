package utils

import (
	"strings"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

// Slugify đổi tiếng Việt có dấu thành đường dẫn không dấu.
// Ví dụ: "Sofa góc chữ L" -> "sofa-goc-chu-l"
func Slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, "đ", "d")

	// Bỏ dấu tiếng Việt
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	if result, _, err := transform.String(t, s); err == nil {
		s = result
	}

	// Chỉ giữ chữ a-z, số 0-9; các ký tự khác đổi thành dấu gạch ngang
	var b strings.Builder
	prevDash := false
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			prevDash = false
		} else if !prevDash && b.Len() > 0 {
			b.WriteRune('-')
			prevDash = true
		}
	}
	return strings.Trim(b.String(), "-")
}
