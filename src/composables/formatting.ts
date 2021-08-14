import MarkdownIt from "markdown-it";
import MarkdownItContainer from "markdown-it-container";

// Remember old renderer, if overridden, or proxy to default renderer

const md = new MarkdownIt();
md.use(MarkdownItContainer, "scroll-step");

// from https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer
const defaultRender =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // If you are sure other plugins can't add `target` - drop check below
  var aIndex = tokens[idx].attrIndex("target");

  if (aIndex < 0) {
    tokens[idx].attrPush(["target", "_blank"]); // add new attribute
  } else {
    // @ts-ignore
    tokens[idx].attrs[aIndex][1] = "_blank"; // replace value of existing attr
  }

  // pass token to default renderer.
  return defaultRender(tokens, idx, options, env, self);
};

export function renderMarkdown(text: string) {
  return md.render(text);
}
