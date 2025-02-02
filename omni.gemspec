# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name          = "omni"
  spec.version       = "0.1.0"
  spec.authors       = ["omnigoat"]
  spec.email         = ["omnigoat@gmail.com"]

  spec.summary       = "A basic blog + article Jekyll theme"
  spec.homepage      = "https://github.com/omni"
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0").select { |f| f.match(%r!^(assets|_layouts|_includes|_sass|LICENSE|README|_config\.yml)!i) }

  spec.add_runtime_dependency "jekyll", "~> 4.3.4"
end
